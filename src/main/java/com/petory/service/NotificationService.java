package com.petory.service;

import com.petory.dto.NotificationDto;
import com.petory.entity.Notification;
import com.petory.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    // 알림 생성
    public Notification createNotification(Long memberId, Notification.NotificationType type, 
                                        String title, String message, Long auctionItemId) {
        Notification notification = Notification.createNotification(memberId, type, title, message, auctionItemId);
        return notificationRepository.save(notification);
    }
    
    // 경매 종료 알림 생성 (모든 참여자에게)
    public void createAuctionEndNotification(Long auctionItemId, List<Long> participantIds) {
        for (Long memberId : participantIds) {
            createNotification(
                memberId,
                Notification.NotificationType.AUCTION_END,
                "🏁 경매 종료",
                "경매가 종료되었습니다. 결과를 확인해보세요!",
                auctionItemId
            );
        }
    }
    
    // 낙찰 성공 알림 생성
    public void createAuctionWinNotification(Long winnerId, Long auctionItemId) {
        createNotification(
            winnerId,
            Notification.NotificationType.AUCTION_WIN,
            "🎉 낙찰 성공!",
            "축하합니다! 경매에서 낙찰되었습니다!",
            auctionItemId
        );
    }
    
    // 새로운 입찰 알림 생성 (다른 사용자들에게)
    public void createNewBidNotification(Long auctionItemId, List<Long> participantIds, Long bidderId) {
        for (Long memberId : participantIds) {
            if (!memberId.equals(bidderId)) { // 입찰자 본인 제외
                createNotification(
                    memberId,
                    Notification.NotificationType.NEW_BID,
                    "🏆 새로운 입찰 발생!",
                    "다른 사용자가 입찰했습니다. 확인해보세요!",
                    auctionItemId
                );
            }
        }
    }
    
    // 사용자의 읽지 않은 알림 조회
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long memberId) {
        List<Notification> notifications = notificationRepository.findUnreadByMemberId(memberId);
        return notifications.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 사용자의 모든 알림 조회
    @Transactional(readOnly = true)
    public List<NotificationDto> getAllNotifications(Long memberId) {
        List<Notification> notifications = notificationRepository.findByMemberId(memberId);
        return notifications.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 읽지 않은 알림 개수 조회
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long memberId) {
        return notificationRepository.countUnreadByMemberId(memberId);
    }
    
    // 알림 읽음 처리
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다: " + notificationId));
        notification.markAsRead();
        notificationRepository.save(notification);
    }
    
    // 알림 삭제 처리
    public void markAsDeleted(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다: " + notificationId));
        notification.markAsDeleted();
        notificationRepository.save(notification);
    }
    
    // 모든 알림 읽음 처리
    public void markAllAsRead(Long memberId) {
        List<Notification> unreadNotifications = notificationRepository.findUnreadByMemberId(memberId);
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
        }
        notificationRepository.saveAll(unreadNotifications);
    }
} 