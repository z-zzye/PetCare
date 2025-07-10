package com.petory.controller;

import com.petory.dto.autoReservation.AvailableSlotResponseDto;
import com.petory.dto.autoReservation.DetailedSlotSearchResponseDto;
import com.petory.dto.autoReservation.ReservationConfirmRequestDto;
import com.petory.dto.autoReservation.SlotSearchRequestDto;
import com.petory.service.AutoReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.petory.service.ReservationScheduler; // test

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auto-reservations")
@RequiredArgsConstructor
@Slf4j
public class AutoReservationController {

  private final AutoReservationService autoReservationService;
  private final ReservationScheduler reservationScheduler;

  /**
   * [1단계: 탐색 API]
   * 프론트엔드로부터 받은 조건(위치, 반경, 백신 종류 등)으로
   * 예약 가능한 병원/시간 슬롯 목록을 조회하여 반환합니다.
   */
  @PostMapping("/search-slots")
  public ResponseEntity<?> searchAvailableSlots(@RequestBody SlotSearchRequestDto requestDto) {
    try {
      log.info("예약 가능 슬롯 탐색 API 호출: {}", requestDto);
      DetailedSlotSearchResponseDto detailedResponse = autoReservationService.findAvailableSlots(requestDto);

      // 결과가 없는 경우도 정상 응답이므로, 빈 리스트를 그대로 반환합니다.
      // 프론트엔드에서 이 리스트의 길이를 보고 분기 처리(반경 확장 제안 등)를 할 수 있습니다.
      return ResponseEntity.ok(detailedResponse);

    } catch (Exception e) {
      log.error("슬롯 탐색 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * [2단계: 확정 API]
   * 사용자가 최종 선택한 슬롯 정보로 예약을 생성하고,
   * '예약 보류(PENDING)' 상태로 DB에 저장합니다.
   */
  @PostMapping("/confirm")
  public ResponseEntity<?> confirmReservation(@RequestBody ReservationConfirmRequestDto requestDto) {
    try {
      log.info("예약 확정 API 호출: {}", requestDto);
      autoReservationService.confirmReservation(requestDto);

      // 성공 시 간단한 메시지를 반환합니다.
      return ResponseEntity.ok(Map.of("message", "예약이 성공적으로 보류 상태로 접수되었습니다."));

    } catch (IllegalStateException e) { // ✅ 동일하게 수정
      log.error("예약 확정 중 처리 불가", e);
      if (e.getMessage().contains("다른 사용자가 예약")) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
      }
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) { // ✅ 동일하게 수정
      log.error("예약 확정 중 예상치 못한 오류 발생", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "서버 내부 오류가 발생했습니다."));
    }
  }

  /**
   * [신규 API] 즉시 결제와 함께 예약을 '확정(CONFIRMED)' 상태로 생성합니다.
   */
  @PostMapping("/confirm-and-pay")
  public ResponseEntity<?> confirmAndPayReservation(@RequestBody ReservationConfirmRequestDto requestDto) {
    try {
      log.info("즉시 결제 예약 API 호출: {}", requestDto);
      autoReservationService.confirmAndPayReservation(requestDto);
      return ResponseEntity.ok(Map.of("message", "예약이 성공적으로 확정되었습니다."));

    } catch (IllegalStateException e) {
      log.error("즉시 결제 예약 중 오류 발생", e);
      if (e.getMessage().contains("다른 사용자가 예약")) {
        // '이미 예약된 슬롯' 오류일 경우 409 Conflict 반환
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
      }
      // 그 외 다른 IllegalStateException은 400 Bad Request 반환
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) { // ✅ 혹시 모를 다른 모든 예외 처리
      log.error("즉시 결제 예약 중 예상치 못한 오류 발생", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "서버 내부 오류가 발생했습니다."));
    }
  }

  //test
  // ✅ [테스트용 임시 API] 스케줄러를 수동으로 실행합니다.
  @Profile("local")
  @PostMapping("/test/run-scheduler")
  public ResponseEntity<String> runSchedulerManually() {
    log.info("수동으로 스케줄러 실행을 요청합니다.");
    reservationScheduler.cancelExpiredPendingReservations();
    return ResponseEntity.ok("스케줄러를 수동으로 실행했습니다. 서버 로그와 DB를 확인해주세요.");
  }
}
