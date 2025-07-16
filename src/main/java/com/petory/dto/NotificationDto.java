package com.petory.dto;

import com.petory.entity.Notification;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    
    private Long notificationId;
    private Long memberId;
    private String notificationType;
    private String title;
    private String message;
    private Long auctionItemId;
    private boolean isRead;
    private LocalDateTime createdAt;
    
    // Entity를 DTO로 변환하는 메서드
    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
                .notificationId(notification.getNotificationId())
                .memberId(notification.getMemberId())
                .notificationType(notification.getNotificationType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .auctionItemId(notification.getAuctionItemId())
                .isRead(notification.isRead())
                .createdAt(notification.getRegDate())
                .build();
    }
} 