package com.petory.controller;

import com.petory.dto.AutoReservationRequestDto;
import com.petory.service.AutoReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auto-reservations")
@RequiredArgsConstructor
public class AutoReservationController {

  private final AutoReservationService autoReservationService;

  @PostMapping("/start")
  public ResponseEntity<String> startAutoReservation(@RequestBody AutoReservationRequestDto requestDto) {
    try {
      autoReservationService.startAutoReservationProcess(requestDto);
      return ResponseEntity.ok("자동 예약 절차를 시작했습니다. 완료 시 알림이 전송됩니다.");
    } catch (Exception e) {
      // 실제 운영 코드에서는 예외 종류에 따라 더 상세한 처리가 필요합니다.
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}
