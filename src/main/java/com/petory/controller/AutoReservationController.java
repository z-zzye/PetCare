package com.petory.controller;

import com.petory.dto.AutoReservationRequestDto;
import com.petory.service.AutoReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auto-reservations")
@RequiredArgsConstructor
public class AutoReservationController {

  private final AutoReservationService autoReservationService;

  @PostMapping("/start")
// ✅ 1. 반환 타입을 Map<String, Object>으로 변경
  public ResponseEntity<Map<String, Object>> startAutoReservation(@RequestBody AutoReservationRequestDto requestDto) {
    try {
      // ✅ 2. 서비스가 반환하는 예약 정보를 result 변수에 저장
      Map<String, Object> result = autoReservationService.startAutoReservationProcess(requestDto);

      // ✅ 3. 서비스로부터 받은 결과(result)를 프론트엔드로 전달
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      Map<String, Object> errorBody = Map.of("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody);
    }
  }
}
