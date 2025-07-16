package com.petory.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
    Principal principal,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      Pageable pageable = PageRequest.of(page, size);
      Page<NotificationDto> notifications = notificationService.getNotifications(principal.getName(), pageable);
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
  public ResponseEntity<?> getUnreadCount(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      long count = notificationService.getUnreadCount(principal.getName());
      return ResponseEntity.ok(Map.of("unreadCount", count));
    } catch (Exception e) {
      log.error("읽지 않은 알림 개수 조회 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * 읽지 않은 알림 목록 조회
   */
  @GetMapping("/unread")
  public ResponseEntity<?> getUnreadNotifications(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      List<NotificationDto> notifications = notificationService.getUnreadNotifications(principal.getName());
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
    Principal principal
  ) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.markAsRead(notificationId, principal.getName());
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
  public ResponseEntity<?> markAllAsRead(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.markAllAsRead(principal.getName());
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
    Principal principal
  ) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.deleteNotification(notificationId, principal.getName());
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
  public ResponseEntity<?> deleteAllNotifications(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      notificationService.deleteAllNotifications(principal.getName());
      return ResponseEntity.ok(Map.of("message", "모든 알림을 삭제했습니다."));
    } catch (Exception e) {
      log.error("모든 알림 삭제 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }
} 