package com.petory.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notification")
public class Notification extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;
    
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;
    
    @Column(name = "title", nullable = false, length = 100)
    private String title;
    
    @Column(name = "message", nullable = false, length = 500)
    private String message;
    
    @Column(name = "auction_item_id")
    private Long auctionItemId;
    
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
    
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;
    
    // 알림 타입 enum
    public enum NotificationType {
        AUCTION_END,    // 경매 종료
        AUCTION_WIN,    // 낙찰 성공
        NEW_BID,        // 새로운 입찰 (다른 사용자)
        BID_SUCCESS,    // 입찰 성공 (본인)
        BID_FAILED      // 입찰 실패
    }
    
    // 알림 생성 메서드
    public static Notification createNotification(
            Long memberId, 
            NotificationType type, 
            String title, 
            String message, 
            Long auctionItemId) {
        
        return Notification.builder()
                .memberId(memberId)
                .notificationType(type)
                .title(title)
                .message(message)
                .auctionItemId(auctionItemId)
                .isRead(false)
                .isDeleted(false)
                .build();
    }
    
    // 읽음 처리 메서드
    public void markAsRead() {
        this.isRead = true;
    }
    
    // 삭제 처리 메서드
    public void markAsDeleted() {
        this.isDeleted = true;
    }
} 