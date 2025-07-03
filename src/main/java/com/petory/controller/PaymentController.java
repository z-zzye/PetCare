package com.petory.controller;

import com.petory.dto.PaymentRegisterDto;
import com.petory.dto.TossBillingConfirmRequestDto;
import com.petory.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentService paymentService;

  // 결제 수단 등록 API
  @PostMapping
  public ResponseEntity<String> registerPaymentMethod(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentRegisterDto request) {
    String memberEmail = userDetails.getUsername();
    paymentService.registerPaymentMethod(memberEmail, request.getBillingKey(), request.getCardInfo());

    return ResponseEntity.ok("결제 수단이 성공적으로 등록되었습니다.");
  }

  // 토스페이먼츠 빌링키 최종 승인 및 등록 API
  @PostMapping("/toss/confirm-billing")
  public ResponseEntity<String> confirmTossBilling(
    @AuthenticationPrincipal UserDetails userDetails,
    @RequestBody TossBillingConfirmRequestDto request) {

    paymentService.confirmTossBilling(
      userDetails.getUsername(),
      request.getAuthKey(),
      request.getCustomerKey()
    );
    return ResponseEntity.ok("결제 수단이 최종 등록되었습니다.");
  }
}
