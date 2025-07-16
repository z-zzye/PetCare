package com.petory.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.petory.dto.ChatMessageDto;
import com.petory.dto.ChatReadEventDto;
import com.petory.dto.ChatReadResultDto;
import com.petory.dto.ChatRoomListDto;
import com.petory.entity.ChatMessage;
import com.petory.entity.ChatRoom;
import com.petory.entity.Member;
import com.petory.repository.ChatMessageRepository;
import com.petory.repository.ChatRoomRepository;
import com.petory.repository.MemberRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

  private final ChatRoomRepository chatRoomRepository;
  private final ChatMessageRepository chatMessageRepository;
  private final MemberRepository memberRepository;
  private final SimpMessagingTemplate messagingTemplate;

  public ChatRoom findOrCreateRoom(Long senderId, Long receiverId) {
    Long first = Math.min(senderId, receiverId);
    Long second = Math.max(senderId, receiverId);

    return chatRoomRepository.findBySenderIdAndReceiverId(first, second)
      .orElseGet(() -> {
        ChatRoom room = new ChatRoom();
        room.setSenderId(first);
        room.setReceiverId(second);
        room.setCreatedAt(LocalDateTime.now());
        return chatRoomRepository.save(room);
      });
  }

  public void sendMessage(ChatMessageDto dto) {
    System.out.println("📦 ChatService: 저장 요청 받은 메시지 = " + dto);
    
    // ✅ 프론트에서 받은 chatRoomId 기준으로 채팅방 조회
    ChatRoom room = chatRoomRepository.findById(dto.getChatRoomId())
      .orElseThrow(() -> new IllegalArgumentException("❗유효하지 않은 채팅방 ID: " + dto.getChatRoomId()));

    ChatMessage message = ChatMessage.builder()
      .chatRoom(room)
      .senderId(dto.getSenderId())
      .message(dto.getMessage())
      .sentAt(LocalDateTime.now())
      .is_read(false)
      .build();

    chatMessageRepository.save(message);

    // ✅ 수신자에게 메시지 전송 (프론트는 이걸 구독하고 있음)
    messagingTemplate.convertAndSend("/queue/chat/" + dto.getReceiverId(), dto);
  }

  @Transactional
  public List<ChatMessageDto> getMessagesAndMarkAsRead(Long roomId, Long memberId) {
    // 메시지 전체 조회
    List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(roomId);

    // 읽지 않은 메시지 중, 내가 보낸 게 아닌 것만 읽음 처리
    messages.stream()
      .filter(msg -> !msg.getSenderId().equals(memberId) && !msg.is_read())
      .forEach(msg -> msg.set_read(true));

    return messages.stream()
      .map(ChatMessageDto::fromEntity)
      .collect(Collectors.toList());
  }

  // ✅ 채팅방 리스트 반환 (내가 senderId 또는 receiverId인 모든 방)
  public List<ChatRoomListDto> getChatRoomsForMember(Long myId) {
    List<ChatRoom> rooms = chatRoomRepository.findAll();
    return rooms.stream()
      .filter(room -> room.getSenderId().equals(myId) || room.getReceiverId().equals(myId))
      .map(room -> {
        Long otherId = room.getSenderId().equals(myId) ? room.getReceiverId() : room.getSenderId();
        Optional<Member> otherOpt = memberRepository.findByMember_Id(otherId);
        String otherNickname = otherOpt.map(Member::getMember_NickName).orElse("알수없음");
        String otherProfile = otherOpt.map(Member::getMember_ProfileImg).orElse(null);
        // 마지막 메시지
        List<ChatMessage> msgs = chatMessageRepository.findByChatRoomOrderBySentAtAsc(room);
        ChatMessage lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size()-1);
        String lastMessage = lastMsg != null ? lastMsg.getMessage() : "";
        String lastMessageTime = lastMsg != null && lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : "";
        
        // 안 읽은 메시지 개수 계산 (내가 보낸 메시지가 아닌 것만)
        int unreadCount = (int) msgs.stream()
          .filter(msg -> !msg.getSenderId().equals(myId) && !msg.is_read())
          .count();
        
        return new ChatRoomListDto(
          room.getId(),
          otherId,
          otherNickname,
          otherProfile,
          lastMessage,
          lastMessageTime,
          unreadCount
        );
      })
      .sorted(Comparator.comparing(ChatRoomListDto::getLastMessageTime, Comparator.nullsLast(Comparator.reverseOrder())))
      .toList();
  }

  public void handleReadEvent(ChatReadEventDto dto) {
    // 1. 해당 채팅방에서 readerId가 아닌 사람이 보낸, is_read=false인 메시지 모두 읽음 처리
    List<ChatMessage> unread = chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(dto.getChatRoomId())
      .stream()
      .filter(msg -> !msg.getSenderId().equals(dto.getReaderId()) && !msg.is_read())
      .toList();
    List<Long> readIds = unread.stream().map(ChatMessage::getId).toList();
    unread.forEach(msg -> msg.set_read(true));
    // 2. 상대방에게 읽음 처리된 메시지 ID 리스트를 WebSocket으로 전송
    // 상대방 ID 구하기
    ChatRoom room = chatRoomRepository.findById(dto.getChatRoomId()).orElse(null);
    if (room != null) {
      Long otherId = room.getSenderId().equals(dto.getReaderId()) ? room.getReceiverId() : room.getSenderId();
      messagingTemplate.convertAndSend("/queue/read/" + otherId, new ChatReadResultDto(dto.getChatRoomId(), readIds));
    }
  }

  // 전체 안 읽은 메시지 개수 조회
  public int getTotalUnreadCount(Long myId) {
    List<ChatRoom> rooms = chatRoomRepository.findAll();
    return rooms.stream()
      .filter(room -> room.getSenderId().equals(myId) || room.getReceiverId().equals(myId))
      .mapToInt(room -> {
        List<ChatMessage> msgs = chatMessageRepository.findByChatRoomOrderBySentAtAsc(room);
        return (int) msgs.stream()
          .filter(msg -> !msg.getSenderId().equals(myId) && !msg.is_read())
          .count();
      })
      .sum();
  }
}

