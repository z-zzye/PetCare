package com.petory.repository;

import com.petory.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // 특정 사용자의 읽지 않은 알림 조회 (최신순)
    @Query("SELECT n FROM Notification n WHERE n.memberId = :memberId AND n.isRead = false AND n.isDeleted = false ORDER BY n.regDate DESC")
    List<Notification> findUnreadByMemberId(@Param("memberId") Long memberId);
    
    // 특정 사용자의 모든 알림 조회 (최신순)
    @Query("SELECT n FROM Notification n WHERE n.memberId = :memberId AND n.isDeleted = false ORDER BY n.regDate DESC")
    List<Notification> findByMemberId(@Param("memberId") Long memberId);
    
    // 특정 사용자의 읽지 않은 알림 개수 조회
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.memberId = :memberId AND n.isRead = false AND n.isDeleted = false")
    Long countUnreadByMemberId(@Param("memberId") Long memberId);
    
    // 특정 경매에 참여한 사용자들의 알림 조회
    @Query("SELECT DISTINCT n.memberId FROM Notification n WHERE n.auctionItemId = :auctionItemId AND n.isDeleted = false")
    List<Long> findMemberIdsByAuctionItemId(@Param("auctionItemId") Long auctionItemId);
    
    // 특정 경매의 특정 타입 알림 조회
    @Query("SELECT n FROM Notification n WHERE n.auctionItemId = :auctionItemId AND n.notificationType = :type AND n.isDeleted = false")
    List<Notification> findByAuctionItemIdAndType(@Param("auctionItemId") Long auctionItemId, @Param("type") Notification.NotificationType type);
    
    // 특정 사용자의 특정 타입 알림 조회
    @Query("SELECT n FROM Notification n WHERE n.memberId = :memberId AND n.notificationType = :type AND n.isDeleted = false ORDER BY n.regDate DESC")
    List<Notification> findByMemberIdAndType(@Param("memberId") Long memberId, @Param("type") Notification.NotificationType type);
} 