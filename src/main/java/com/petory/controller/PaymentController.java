package com.petory.controller;

import com.petory.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/portone")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentService paymentService;

  /**
   * 프론트엔드로부터 카드 인증 성공 후 받은 imp_uid를 사용하여
   * 빌링키를 발급하고 DB에 저장하는 최종 승인 API
   *
   * @param payload 프론트에서 전송한 JSON 데이터 (e.g., { "imp_uid": "imp_1234..." })
   * @return 처리 성공 또는 실패 메시지를 담은 응답
   */
  @PostMapping("/issue-billing-key")
  public ResponseEntity<?> issueBillingKey(@RequestBody Map<String, String> payload) {
    try {
      // ✅ 프론트에서 'imp_uid' 또는 'paymentId'라는 키로 넘어온 값을 추출
      // 포트원 V1 SDK는 imp_uid, V2 SDK는 paymentId를 주로 사용합니다.
      // 둘 중 하나를 사용하거나, 둘 다 받을 수 있도록 유연하게 처리할 수 있습니다.
      String impUid = payload.get("imp_uid");
      if (impUid == null) {
        impUid = payload.get("paymentId"); // V2 SDK 호환을 위해 paymentId도 확인
      }

      if (impUid == null || impUid.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("error", "인증 고유번호(imp_uid 또는 paymentId)가 필요합니다."));
      }

      // ✅ PaymentService의 메서드를 호출하여 로직 실행
      paymentService.issueBillingKeyAndSave(impUid);

      // ✅ 성공 응답 반환
      return ResponseEntity.ok().body(Map.of("message", "결제 수단이 성공적으로 등록되었습니다."));

    } catch (Exception e) {
      // 🚨 서비스 로직에서 발생한 예외 처리
      // (예: 카드 인증 검증 실패, 존재하지 않는 사용자 등)
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  // TODO: 필요에 따라 결제 실행, 환불 등의 다른 API 엔드포인트를 추가할 수 있습니다.
}
