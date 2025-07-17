package com.petory.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.petory.config.CustomUserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.petory.dto.NotificationDto;
import com.petory.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

  private final NotificationService notificationService;

  /**
   * 알림 목록 조회 (페이징)
   */
  @GetMapping
  public ResponseEntity<?> getNotifications(
    @AuthenticationPrincipal CustomUserDetails userDetails,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      Pageable pageable = PageRequest.of(page, size);
      Page<NotificationDto> notifications = notificationService.getNotifications(userDetails.getUsername(), pageable);
      return ResponseEntity.ok(notifications);
    } catch (Exception e) {
      log.error("알림 목록 조회 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  @GetMapping("/unread-count")
  public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
    log.info("읽지 않은 알림 개수 조회 요청 - userDetails: {}", userDetails);
    log.info("읽지 않은 알림 개수 조회 요청 - userDetails가 null인지: {}", userDetails == null);
    
    if (userDetails == null) {
      log.warn("읽지 않은 알림 개수 조회 실패: 로그인이 필요합니다.");
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      log.info("읽지 않은 알림 개수 조회 시작 - userEmail: {}", userDetails.getUsername());
      long count = notificationService.getUnreadCount(userDetails.getUsername());
      log.info("읽지 않은 알림 개수 조회 완료 - count: {}", count);
      return ResponseEntity.ok(Map.of("unreadCount", count));
    } catch (Exception e) {
      log.error("읽지 않은 알림 개수 조회 중 오류 발생 - userEmail: {}", userDetails.getUsername(), e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 읽지 않은 알림 목록 조회
   */
  @GetMapping("/unread")
  public ResponseEntity<?> getUnreadNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      List<NotificationDto> notifications = notificationService.getUnreadNotifications(userDetails.getUsername());
      return ResponseEntity.ok(notifications);
    } catch (Exception e) {
      log.error("읽지 않은 알림 목록 조회 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 특정 알림 읽음 처리
   */
  @PutMapping("/{notificationId}/read")
  public ResponseEntity<?> markAsRead(
    @PathVariable Long notificationId,
    @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.markAsRead(notificationId, userDetails.getUsername());
      return ResponseEntity.ok(Map.of("message", "알림을 읽음 처리했습니다."));
    } catch (Exception e) {
      log.error("알림 읽음 처리 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  @PutMapping("/read-all")
  public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.markAllAsRead(userDetails.getUsername());
      return ResponseEntity.ok(Map.of("message", "모든 알림을 읽음 처리했습니다."));
    } catch (Exception e) {
      log.error("모든 알림 읽음 처리 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 특정 알림 삭제
   */
  @DeleteMapping("/{notificationId}")
  public ResponseEntity<?> deleteNotification(
    @PathVariable Long notificationId,
    @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.deleteNotification(notificationId, userDetails.getUsername());
      return ResponseEntity.ok(Map.of("message", "알림을 삭제했습니다."));
    } catch (Exception e) {
      log.error("알림 삭제 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 모든 알림 삭제
   */
  @DeleteMapping
  public ResponseEntity<?> deleteAllNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.deleteAllNotifications(userDetails.getUsername());
      return ResponseEntity.ok(Map.of("message", "모든 알림을 삭제했습니다."));
    } catch (Exception e) {
      log.error("모든 알림 삭제 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }
} 