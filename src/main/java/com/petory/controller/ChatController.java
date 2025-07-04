package com.petory.controller;

import com.petory.dto.ChatMessageDto;
import com.petory.entity.ChatMessage;
import com.petory.entity.ChatRoom;
import com.petory.repository.ChatMessageRepository;
import com.petory.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class ChatController {

  private final SimpMessagingTemplate messagingTemplate;
  private final ChatRoomRepository chatRoomRepository;
  private final ChatMessageRepository chatMessageRepository;

  @MessageMapping("/chat.send")  // 클라이언트에서 /app/chat.send로 보냄
  public void sendMessage(@Payload ChatMessageDto dto) {
    ChatRoom room = chatRoomRepository.findBySenderIdAndReceiverId(dto.getSenderId(), dto.getReceiverId())
      .orElseGet(() -> {
        ChatRoom newRoom = ChatRoom.builder()
          .senderId(dto.getSenderId())
          .receiverId(dto.getReceiverId())
          .createdAt(LocalDateTime.now())
          .build();
        return chatRoomRepository.save(newRoom);
      });

    ChatMessage message = ChatMessage.builder()
      .chatRoom(room)
      .senderId(dto.getSenderId())
      .message(dto.getMessage())
      .sentAt(LocalDateTime.now())
      .is_read(false)
      .build();
    chatMessageRepository.save(message);

    // 수신자에게 메시지 전송
    messagingTemplate.convertAndSend("/queue/chat/" + dto.getReceiverId(), dto);
  }
}
