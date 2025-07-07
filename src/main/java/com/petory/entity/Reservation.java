package com.petory.entity;

import com.petory.constant.ReservationStatus;
import com.petory.constant.VaccineType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Reservation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "reservation_id")
  private Long id;

  // 예약한 회원 정보
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  // 예약 대상 펫 정보
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "pet_num", nullable = false)
  private Pet pet;

  // 예약한 병원 이름 (외부 정보이므로 일단 문자열로 저장)
  @Column(nullable = false)
  private String hospitalName;

  // 확정된 예약 일시
  @Column(nullable = false)
  private LocalDateTime reservationDateTime;

  // 예약 종류 (예: 예방접종, 미용, 일반진료 등)
  @Enumerated(EnumType.STRING)
  private VaccineType vaccineType;

  // 예약 상태 (예: 예약확정, 방문완료, 취소 등)
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReservationStatus reservationStatus;

  // 참고: 생성일, 수정일 등은 BaseEntity 등을 상속받아 공통 관리할 수 있습니다.
}
