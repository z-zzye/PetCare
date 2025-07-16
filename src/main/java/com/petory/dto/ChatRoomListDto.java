package com.petory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomListDto {
    private Long chatRoomId;
    private Long otherMemberId;
    private String otherMemberNickname;
    private String otherMemberProfileImg;
    private String lastMessage;
    private String lastMessageTime;
    private int unreadCount;
} 