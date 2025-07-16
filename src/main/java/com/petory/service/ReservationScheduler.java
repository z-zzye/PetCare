package com.petory.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.petory.constant.ReservationStatus;
import com.petory.entity.Reservation;
import com.petory.repository.ReservationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {

  private final ReservationRepository reservationRepository;
  private final RestTemplate restTemplate;
  private final NotificationService notificationService;

  // 매일 새벽 1시에 실행 (cron = "초 분 시 일 월 요일")
  @Scheduled(cron = "0 0 1 * * ?")
  @Transactional
  public void cancelExpiredPendingReservations() {
    log.info("===== 만료된 예약 보류 건 자동 취소 스케줄러 시작 =====");

    // 1. 결제 기한이 지난 PENDING 상태의 예약을 모두 찾습니다.
    LocalDateTime now = LocalDateTime.now();
    List<Reservation> expiredReservations = reservationRepository
      .findByReservationStatusAndPaymentDueDateBefore(ReservationStatus.PENDING, now);

    if (expiredReservations.isEmpty()) {
      log.info("취소할 예약이 없습니다.");
      return;
    }

    log.info("{}개의 만료된 예약을 취소 처리합니다.", expiredReservations.size());

    // 2. 각 예약을 순회하며 처리합니다.
    for (Reservation reservation : expiredReservations) {
      // 2-1. 우리 DB의 예약 상태를 CANCELED로 변경
      reservation.setReservationStatus(ReservationStatus.CANCELED);
      log.info("Reservation ID: {} 상태를 CANCELED로 변경.", reservation.getId());

      // 2-2. 더미 서버에 해당 슬롯을 다시 풀어달라고 요청
      String url = "http://localhost:3001/api/hospitals/cancel-slot";
      Map<String, String> requestBody = new HashMap<>();
      requestBody.put("hospitalId", reservation.getReservedHospitalId());
      requestBody.put("targetDate", reservation.getReservedDate().toString());
      requestBody.put("timeSlot", reservation.getReservedTimeSlot());

      try {
        restTemplate.postForEntity(url, requestBody, Map.class);
        log.info("더미 서버에 슬롯 취소 요청 완료: Hospital ID {}", reservation.getReservedHospitalId());
      } catch (Exception e) {
        log.error("더미 서버 슬롯 취소 요청 실패: Reservation ID {}", reservation.getId(), e);
      }

      // 2-3. 알림 생성
      try {
        notificationService.createAutoVaxCancelNotification(
          reservation.getMember(),
          reservation.getId(),
          reservation.getPet().getPet_Num(),
          reservation.getPet().getPet_Name(),
          reservation.getHospitalName()
        );
      } catch (Exception e) {
        log.error("스케줄러 알림 생성 중 오류 발생: Reservation ID {}", reservation.getId(), e);
        // 알림 생성 실패가 스케줄러 작업을 막지 않도록 예외를 던지지 않음
      }
    }
    log.info("===== 스케줄러 작업 완료 =====");
  }
}
