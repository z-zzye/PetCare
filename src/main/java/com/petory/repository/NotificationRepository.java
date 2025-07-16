package com.petory.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.petory.entity.Member;
import com.petory.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  
  // 특정 회원의 모든 알림 조회 (최신순)
  Page<Notification> findByMemberOrderByRegDateDesc(Member member, Pageable pageable);
  
  // 특정 회원의 읽지 않은 알림 개수 조회
  long countByMemberAndIsReadFalse(Member member);
  
  // 특정 회원의 읽지 않은 알림 목록 조회
  List<Notification> findByMemberAndIsReadFalseOrderByRegDateDesc(Member member);
  
  // 특정 회원의 모든 알림을 읽음 처리
  @Modifying
  @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.member = :member AND n.isRead = false")
  void markAllAsRead(@Param("member") Member member, @Param("readAt") LocalDateTime readAt);
  
  // 특정 알림을 읽음 처리
  @Modifying
  @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :notificationId")
  void markAsRead(@Param("notificationId") Long notificationId, @Param("readAt") LocalDateTime readAt);
  
  // 특정 회원의 모든 알림 삭제
  @Modifying
  @Query("DELETE FROM Notification n WHERE n.member = :member")
  void deleteByMember(@Param("member") Member member);
} 