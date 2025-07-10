package com.petory.controller;

import com.petory.dto.autoReservation.PaymentMethodResponseDto;
import com.petory.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/mock") // 경로를 /mock으로 변경하여 명확히 함
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

  private final PaymentService paymentService;

  /**
   * [모의 API] 현재 로그인한 사용자의 결제 수단을 등록 처리(흉내)합니다.
   * 프론트엔드로부터 아무런 데이터도 받지 않습니다.
   */
  @PostMapping("/register")
  public ResponseEntity<?> registerMockPaymentMethod() {
    try {
      log.info("모의 결제 수단 등록 API 호출");
      paymentService.registerMockBillingKeyForCurrentUser();
      return ResponseEntity.ok(Map.of("message", "결제 수단이 성공적으로 등록되었습니다. (모의)"));

    } catch (Exception e) {
      log.error("모의 결제 수단 등록 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/my-method")
  public ResponseEntity<?> getMyPaymentMethod() {
    try {
      log.info("등록된 결제 수단 정보 조회 API 호출");
      PaymentMethodResponseDto responseDto = paymentService.getMyPaymentMethod();

      if (responseDto == null) {
        // 등록된 정보가 없는 경우, 404 Not Found 대신 빈 객체와 200 OK를 반환하여
        // 프론트엔드가 분기처리를 쉽게 하도록 합니다.
        return ResponseEntity.ok().build();
      }
      return ResponseEntity.ok(responseDto);

    } catch (Exception e) {
      log.error("결제 수단 조회 중 오류 발생", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", e.getMessage()));
    }
  }
}
