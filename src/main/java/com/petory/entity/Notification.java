package com.petory.entity;

import java.time.LocalDateTime;

import com.petory.constant.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 수신자 (필수)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  // 알림 타입 (필수)
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private NotificationType notificationType;

  // 알림 제목 (필수)
  @Column(nullable = false, length = 200)
  private String title;

  // 알림 내용 (필수)
  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  // 읽음 여부 (기본값: false)
  @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
  private Boolean isRead = false;

  // 읽은 시간
  @Column
  private LocalDateTime readAt;

  // 관련 예약 ID (예약 관련 알림인 경우)
  @Column
  private Long reservationId;

  // 관련 펫 ID (펫 관련 알림인 경우)
  @Column
  private Long petId;
}
