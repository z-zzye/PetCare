package com.petory.dto;

import java.time.LocalDateTime;

import com.petory.constant.NotificationType;
import com.petory.entity.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
  
  private Long id;
  private NotificationType notificationType;
  private String title;
  private String message;
  private Boolean isRead;
  private LocalDateTime createdAt;
  private LocalDateTime readAt;
  private Long reservationId;
  private Long petId;
  private Long auctionId;
  
  // 엔티티를 DTO로 변환하는 생성자
  public NotificationDto(Notification notification) {
    this.id = notification.getId();
    this.notificationType = notification.getNotificationType();
    this.title = notification.getTitle();
    this.message = notification.getMessage();
    this.isRead = notification.getIsRead();
    this.createdAt = notification.getRegDate();
    this.readAt = notification.getReadAt();
    this.reservationId = notification.getReservationId();
    this.petId = notification.getPetId();
    this.auctionId = notification.getAuctionId();
  }
} 