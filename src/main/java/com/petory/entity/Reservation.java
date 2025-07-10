package com.petory.entity;

import com.petory.constant.ReservationStatus;
import com.petory.constant.VaccineType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalDate;

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
  private String hospitalAddress; // 병원 주소
  private String hospitalPhone; // 병원 전화번호

  // 확정된 예약 일시
  @Column(nullable = false)
  private LocalDateTime reservationDateTime;

  // 접종 종류
  @Enumerated(EnumType.STRING)
  private VaccineType vaccineType;

  // 예약 상태 (예: 예약확정, 방문완료, 취소 등)
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReservationStatus reservationStatus;

  @Column(nullable = false)
  private Integer totalAmount; // 총 접종비

  @Column(nullable = false)
  private Integer deposit;     // 예약금

  // 예약 보류 상태의 결제 마감 기한
  private LocalDateTime paymentDueDate;

  // 더미 서버의 슬롯 취소를 위한 정보
  private String reservedHospitalId;
  private LocalDate reservedDate;
  private String reservedTimeSlot;
}
