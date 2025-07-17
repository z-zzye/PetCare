package com.petory.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.constant.NotificationType;
import com.petory.dto.NotificationDto;
import com.petory.entity.Member;
import com.petory.entity.Notification;
import com.petory.repository.MemberRepository;
import com.petory.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final MemberRepository memberRepository;

  /**
   * 알림 생성
   */
  public Notification createNotification(Member member, NotificationType type, String title, String message, Long reservationId, Long petId) {
    Notification notification = Notification.builder()
      .member(member)
      .notificationType(type)
      .title(title)
      .message(message)
      .isRead(false)
      .reservationId(reservationId)
      .petId(petId)
      .build();

    return notificationRepository.save(notification);
  }

  /**
   * 회원의 알림 목록 조회 (페이징)
   */
  @Transactional(readOnly = true)
  public Page<NotificationDto> getNotifications(String userEmail, Pageable pageable) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    Page<Notification> notifications = notificationRepository.findByMemberOrderByRegDateDesc(member, pageable);
    return notifications.map(NotificationDto::new);
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  @Transactional(readOnly = true)
  public long getUnreadCount(String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    return notificationRepository.countByMemberAndIsReadFalse(member);
  }

  /**
   * 읽지 않은 알림 목록 조회
   */
  @Transactional(readOnly = true)
  public List<NotificationDto> getUnreadNotifications(String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    List<Notification> notifications = notificationRepository.findByMemberAndIsReadFalseOrderByRegDateDesc(member);
    return notifications.stream()
      .map(NotificationDto::new)
      .collect(Collectors.toList());
  }

  /**
   * 특정 알림 읽음 처리
   */
  public void markAsRead(Long notificationId, String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    Notification notification = notificationRepository.findById(notificationId)
      .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

    // 권한 확인
    if (!notification.getMember().getMember_Id().equals(member.getMember_Id())) {
      throw new SecurityException("해당 알림에 대한 권한이 없습니다.");
    }

    notificationRepository.markAsRead(notificationId, LocalDateTime.now());
  }

  /**
   * 모든 알림 읽음 처리
   */
  public void markAllAsRead(String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    notificationRepository.markAllAsRead(member, LocalDateTime.now());
  }

  /**
   * 특정 알림 삭제
   */
  public void deleteNotification(Long notificationId, String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    Notification notification = notificationRepository.findById(notificationId)
      .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

    // 권한 확인
    if (!notification.getMember().getMember_Id().equals(member.getMember_Id())) {
      throw new SecurityException("해당 알림에 대한 권한이 없습니다.");
    }

    notificationRepository.delete(notification);
  }

  /**
   * 모든 알림 삭제
   */
  public void deleteAllNotifications(String userEmail) {
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    notificationRepository.deleteByMember(member);
  }

  /**
   * 자동예약 취소 알림 생성
   */
  public void createAutoVaxCancelNotification(Member member, Long reservationId, Long petId, String petName, String hospitalName) {
    String title = "자동예약이 취소되었습니다";
    String message = String.format("%s의 %s 예약이 취소되었습니다.", petName, hospitalName);

    createNotification(member, NotificationType.AUTOVAXCANCEL, title, message, reservationId, petId);
    log.info("자동예약 취소 알림 생성: memberId={}, reservationId={}", member.getMember_Id(), reservationId);
  }

  /**
   * 자동예약 완료 알림 생성
   */
  public void createAutoVaxCompleteNotification(Member member, Long reservationId, Long petId, String petName, String hospitalName) {
    String title = "접종이 완료되었습니다";
    String message = String.format("%s의 접종이 완료되어 다음 예약이 자동으로 생성되었습니다.", petName);

    createNotification(member, NotificationType.AUTOCVAXOMPLETE, title, message, reservationId, petId);
    log.info("자동예약 완료 알림 생성: memberId={}, reservationId={}", member.getMember_Id(), reservationId);
  }

  /**
   * 클린봇 감지 알림 생성
   */
  public void createCleanBotDetectedNotification(Member member, String content) {
    String title = "부적절한 내용이 감지되었습니다";
    String message = String.format("작성하신 내용에서 부적절한 표현이 감지되어 블라인드 처리되었습니다 : %s", content);

    createNotification(member, NotificationType.CLEANBOTDETECTED, title, message, null, null);
    log.info("클린봇 감지 알림 생성: memberId={}", member.getMember_Id());
  }
}
