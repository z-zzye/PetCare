package com.petory.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
  private Long senderId;
  private Long receiverId;
  private String message;
}
