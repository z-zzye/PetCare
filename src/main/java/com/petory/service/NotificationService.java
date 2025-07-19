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
    log.info("읽지 않은 알림 개수 조회 시작 - userEmail: {}", userEmail);
    
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> {
        log.error("사용자를 찾을 수 없습니다 - userEmail: {}", userEmail);
        return new IllegalArgumentException("사용자를 찾을 수 없습니다.");
      });

    long count = notificationRepository.countByMemberAndIsReadFalse(member);
    log.info("읽지 않은 알림 개수 조회 완료 - userEmail: {}, count: {}", userEmail, count);
    
    return count;
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

  /**
   * 경매 종료 알림 생성
   */
  public void createAuctionEndNotification(Member member, String itemName, Long auctionItemId) {
    String title = "경매가 종료되었습니다";
    String message = String.format("%s 경매가 종료되었습니다. 결과를 확인해보세요.", itemName);

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.AUCTION_END)
      .title(title)
      .message(message)
      .isRead(false)
      .auctionId(auctionItemId)
      .build();

    notificationRepository.save(notification);
    log.info("경매 종료 알림 생성: memberId={}, auctionItemId={}", member.getMember_Id(), auctionItemId);
  }

  /**
   * 경매 낙찰 알림 생성
   */
  public void createAuctionWinNotification(Member member, String itemName, Long auctionItemId, Integer finalPrice) {
    String title = "🎉 경매에서 낙찰되었습니다!";
    String message = String.format("%s 경매에서 %dP로 낙찰되었습니다. 축하합니다!", itemName, finalPrice);

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.AUCTION_WIN)
      .title(title)
      .message(message)
      .isRead(false)
      .auctionId(auctionItemId)
      .build();

    notificationRepository.save(notification);
    log.info("경매 낙찰 알림 생성: memberId={}, auctionItemId={}, finalPrice={}", member.getMember_Id(), auctionItemId, finalPrice);
  }

  /**
   * 크리에이터 신청 승인 알림 생성
   */
  @Transactional
  public void createCreatorApprovedNotification(Member member) {
    String title = "🎉 크리에이터 자격신청이 승인되었습니다!";
    String message = "축하합니다! 크리에이터 파트너십 신청이 승인되었습니다. 이제 크리에이터 전용 기능을 이용하실 수 있습니다.";

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.CREATOR_APPROVED)
      .title(title)
      .message(message)
      .isRead(false)
      .build();

    notificationRepository.save(notification);
    log.info("크리에이터 승인 알림 생성: memberId={}", member.getMember_Id());
  }

  /**
   * 크리에이터 신청 거절 알림 생성
   */
  @Transactional
  public void createCreatorRejectedNotification(Member member, String rejectReason) {
    String title = "크리에이터 자격신청이 거절되었습니다";
    String message = String.format("크리에이터 파트너십 신청이 거절되었습니다.\n\n사유: %s\n\n재신청을 원하시면 다시 신청해주세요.", rejectReason);

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.CREATOR_REJECTED)
      .title(title)
      .message(message)
      .isRead(false)
      .build();

    notificationRepository.save(notification);
    log.info("크리에이터 거절 알림 생성: memberId={}, rejectReason={}", member.getMember_Id(), rejectReason);
  }

  /**
   * 수의사 신청 승인 알림 생성
   */
  @Transactional
  public void createVetApprovedNotification(Member member) {
    String title = "🎉 수의사 자격신청이 승인되었습니다!";
    String message = "축하합니다! 수의사 파트너십 신청이 승인되었습니다. 이제 수의사 전용 기능을 이용하실 수 있습니다.";

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.VET_APPROVED)
      .title(title)
      .message(message)
      .isRead(false)
      .build();

    notificationRepository.save(notification);
    log.info("수의사 승인 알림 생성: memberId={}", member.getMember_Id());
  }

  /**
   * 수의사 신청 거절 알림 생성
   */
  @Transactional
  public void createVetRejectedNotification(Member member, String rejectReason) {
    String title = "수의사 자격신청이 거절되었습니다";
    String message = String.format("수의사 파트너십 신청이 거절되었습니다.\n\n사유: %s\n\n재신청을 원하시면 다시 신청해주세요.", rejectReason);

    Notification notification = Notification.builder()
      .member(member)
      .notificationType(NotificationType.VET_REJECTED)
      .title(title)
      .message(message)
      .isRead(false)
      .build();

    notificationRepository.save(notification);
    log.info("수의사 거절 알림 생성: memberId={}, rejectReason={}", member.getMember_Id(), rejectReason);
  }
}
