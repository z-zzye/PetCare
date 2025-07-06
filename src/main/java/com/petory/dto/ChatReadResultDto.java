package com.petory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadResultDto {
    private Long chatRoomId;
    private List<Long> readMessageIds;
} 