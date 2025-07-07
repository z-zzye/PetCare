package com.petory.controller;

import com.petory.config.CustomUserDetails;
import com.petory.dto.ChatMessageDto;
import com.petory.dto.ChatRoomListDto;
import com.petory.dto.ChatReadEventDto;
import com.petory.dto.ChatReadResultDto;
import com.petory.entity.ChatMessage;
import com.petory.entity.ChatRoom;
import com.petory.repository.ChatMessageRepository;
import com.petory.repository.ChatRoomRepository;
import com.petory.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

  private final ChatService chatService;

  @GetMapping("/room/{receiverId}")
  public ResponseEntity<Long> getOrCreateRoom(@AuthenticationPrincipal CustomUserDetails user,
                                              @PathVariable Long receiverId) {
    Long senderId = user.getMember().getMember_Id();
    ChatRoom room = chatService.findOrCreateRoom(senderId, receiverId);
    return ResponseEntity.ok(room.getId());
  }

  @MessageMapping("/chat.send")
  public void handleChatMessage(@Payload ChatMessageDto dto) {
    System.out.println("📥 WebSocket 메시지 수신됨: " + dto);
    chatService.sendMessage(dto);
  }

  @MessageMapping("/chat.read")
  public void handleReadMessage(@Payload ChatReadEventDto dto) {
    chatService.handleReadEvent(dto);
  }

  // 메시지 조회 + 읽음 처리
  @GetMapping("/room/{roomId}/messages")
  public ResponseEntity<List<ChatMessageDto>> getMessages(@PathVariable Long roomId,
                                                          @AuthenticationPrincipal CustomUserDetails user) {
    Long memberId = user.getMember().getMember_Id();
    List<ChatMessageDto> messages = chatService.getMessagesAndMarkAsRead(roomId, memberId);
    return ResponseEntity.ok(messages);
  }

  // ✅ 채팅방 리스트 반환
  @GetMapping("/rooms")
  public ResponseEntity<List<ChatRoomListDto>> getMyChatRooms(@AuthenticationPrincipal CustomUserDetails user) {
    Long myId = user.getMember().getMember_Id();
    List<ChatRoomListDto> rooms = chatService.getChatRoomsForMember(myId);
    return ResponseEntity.ok(rooms);
  }
}

