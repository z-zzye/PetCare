package com.petory.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
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

  // 매시간 실행 (cron = "초 분 시 일 월 요일")
  @Scheduled(cron = "0 0 */1 * * ?")
  @Transactional
  public void cancelExpiredPendingReservations() {
    long startTime = System.currentTimeMillis();
    log.info("===== 만료된 예약 보류 건 자동 취소 스케줄러 시작 =====");

    // 1. 결제 기한이 지난 PENDING 상태의 예약 조회
    LocalDateTime now = LocalDateTime.now();
    List<Reservation> expiredReservations = reservationRepository
      .findByReservationStatusAndPaymentDueDateBefore(ReservationStatus.PENDING, now);

    if (expiredReservations.isEmpty()) {
      log.info("취소할 예약이 없습니다.");
      return;
    }

    log.info("{}개의 만료된 예약을 배치 처리합니다.", expiredReservations.size());

    // 2. 배치로 예약 상태를 CANCELED로 변경
    List<Long> expiredReservationIds = expiredReservations.stream()
        .map(Reservation::getId)
        .toList();

    int updatedCount = reservationRepository.updateStatusBatch(expiredReservationIds, ReservationStatus.CANCELED);
    log.info("{}개의 예약 상태를 CANCELED로 배치 변경했습니다.", updatedCount);

    // 3. 더미 서버 슬롯 취소 처리
    cancelSlotsInBatch(expiredReservations);

    // 4. 알림 생성
    sendCancelNotificationsAsync(expiredReservations);

    long endTime = System.currentTimeMillis();
    log.info("===== 스케줄러 작업 완료 (실행 시간: {}ms) =====", endTime - startTime);
  }

  /**
   * 더미 서버 슬롯 취소를 병렬로 처리
   */
  private void cancelSlotsInBatch(List<Reservation> expiredReservations) {
    log.info("더미 서버의 슬롯을 취소 처리합니다.");

    // 더미 서버 호출
    expiredReservations.parallelStream().forEach(reservation -> {
      try {
        String url = "http://localhost:3001/api/hospitals/cancel-slot";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("hospitalId", reservation.getReservedHospitalId());
        requestBody.put("targetDate", reservation.getReservedDate().toString());
        requestBody.put("timeSlot", reservation.getReservedTimeSlot());

        restTemplate.postForEntity(url, requestBody, Map.class);
        log.debug("더미 서버 슬롯 취소 완료: Hospital ID {}", reservation.getReservedHospitalId());
      } catch (Exception e) {
        log.error("더미 서버 슬롯 취소 실패: Reservation ID {}", reservation.getId(), e);
      }
    });

    log.info("더미 서버 슬롯 취소 처리 완료");
  }

  /**
   * 알림 생성을 비동기로 처리
   */
  @Async
  public void sendCancelNotificationsAsync(List<Reservation> expiredReservations) {
    log.info("{}개의 취소 알림을 생성합니다.", expiredReservations.size());

    // CompletableFuture를 사용하여 병렬로 알림 생성
    List<CompletableFuture<Void>> notificationFutures = expiredReservations.stream()
        .map(reservation -> CompletableFuture.runAsync(() -> {
          try {
            notificationService.createAutoVaxCancelNotification(
              reservation.getMember(),
              reservation.getId(),
              reservation.getPet().getPet_Num(),
              reservation.getPet().getPet_Name(),
              reservation.getHospitalName()
            );
          } catch (Exception e) {
            log.error("알림 생성 실패: Reservation ID {}", reservation.getId(), e);
          }
        }))
        .toList();

    // 모든 알림 생성 완료 대기
    CompletableFuture.allOf(notificationFutures.toArray(new CompletableFuture[0])).join();
    log.info("모든 취소 알림 생성 완료");
  }
}
