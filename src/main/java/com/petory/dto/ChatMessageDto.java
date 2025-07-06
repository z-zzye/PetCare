package com.petory.dto;

import com.petory.entity.ChatMessage;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
  private Long id;
  private Long senderId;
  private Long receiverId;
  private String message;
  private Long chatRoomId;
  private boolean isRead;
  private LocalDateTime sentAt;

  public static ChatMessageDto fromEntity(ChatMessage entity) {
    return ChatMessageDto.builder()
      .id(entity.getId())
      .senderId(entity.getSenderId())
      .receiverId(entity.getChatRoom().getSenderId().equals(entity.getSenderId())
        ? entity.getChatRoom().getReceiverId()
        : entity.getChatRoom().getSenderId())
      .message(entity.getMessage())
      .chatRoomId(entity.getChatRoom().getId())
      .isRead(entity.is_read())
      .sentAt(entity.getSentAt())
      .build();
  }
}
