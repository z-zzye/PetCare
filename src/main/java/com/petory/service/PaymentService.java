package com.petory.service;

import com.petory.entity.Member;
import com.petory.entity.PaymentMethod;
import com.petory.repository.MemberRepository;
import com.petory.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

  private final MemberRepository memberRepository;
  private final PaymentMethodRepository paymentMethodRepository;

  // 프론트엔드에서 전달받은 빌링 키로 결제 수단 등록
  public PaymentMethod registerPaymentMethod(String memberEmail, String billingKey, String cardInfo) {
    // 1. 결제 수단 사용자 정보 조회
    Member member = memberRepository.findByMember_Email(memberEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    // 2. 새 결제 수단 객체 생성
    boolean isFirstMethod = paymentMethodRepository.countByMember(member) == 0;
    PaymentMethod newMethod = PaymentMethod.builder()
      .member(member)
      .billingKey(billingKey)
      .cardInfo(cardInfo)
      .isDefault(isFirstMethod)
      .build();

    // 3. DB에 저장
    return paymentMethodRepository.save(newMethod);
  }

  /**
   * 토스페이먼츠로부터 받은 authKey로 최종 빌링키를 발급받고 DB에 저장합니다.
   */
  @Transactional
  public void confirmTossBilling(String memberEmail, String authKey, String customerKey) {
    // 1. 서버 간 통신으로 토스페이먼츠에 최종 승인 요청을 보냅니다.
    // WebClient나 RestTemplate을 사용하여 POST 요청을 보내야 합니다.
    // 요청 시 'Authorization' 헤더에 시크릿 키를 Base64 인코딩하여 담아야 합니다.

    // (이 부분은 실제 구현 시 WebClient 등으로 작성해야 합니다)
    // Hypothetical response from Toss Payments:
    // String billingKey = response.getBillingKey();
    // String cardInfo = response.getCardInfo();

    // 2. 가상 응답으로 로직을 대체합니다.
    // TODO: 실제 토스페이먼츠 API 연동 로직으로 교체 필요
    String billingKeyFromToss = "bkey_" + java.util.UUID.randomUUID().toString().replaceAll("-", "");
    String cardInfoFromToss = "테스트 카드 (승인 완료)";

    // 3. 기존의 registerPaymentMethod 로직과 유사하게 DB에 저장합니다.
    Member member = memberRepository.findByMember_Email(memberEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    boolean isFirstMethod = paymentMethodRepository.countByMember(member) == 0;

    PaymentMethod newMethod = PaymentMethod.builder()
      .member(member)
      .billingKey(billingKeyFromToss) // 토스에서 받은 최종 빌링키
      .cardInfo(cardInfoFromToss)     // 토스에서 받은 카드 정보
      .isDefault(isFirstMethod)
      .build();

    paymentMethodRepository.save(newMethod);
  }

}
