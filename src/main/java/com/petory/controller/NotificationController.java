package com.petory.controller;

import com.petory.config.CustomUserDetails;
import com.petory.dto.NotificationDto;
import com.petory.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    
    // 읽지 않은 알림 조회
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long memberId = userDetails.getMemberId();
            List<NotificationDto> notifications = notificationService.getUnreadNotifications(memberId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 모든 알림 조회
    @GetMapping("/all")
    public ResponseEntity<List<NotificationDto>> getAllNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long memberId = userDetails.getMemberId();
            List<NotificationDto> notifications = notificationService.getAllNotifications(memberId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 읽지 않은 알림 개수 조회
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long memberId = userDetails.getMemberId();
            Long count = notificationService.getUnreadCount(memberId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 특정 알림 읽음 처리
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.markAsRead(notificationId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 모든 알림 읽음 처리
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long memberId = userDetails.getMemberId();
            notificationService.markAllAsRead(memberId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 알림 삭제
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.markAsDeleted(notificationId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 