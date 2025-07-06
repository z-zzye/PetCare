package com.petory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadEventDto {
    private Long chatRoomId;
    private Long readerId;
} 