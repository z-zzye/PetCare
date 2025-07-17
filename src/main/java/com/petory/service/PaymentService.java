package com.petory.service;

import java.util.List;
import java.util.UUID;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.petory.dto.autoReservation.PaymentMethodResponseDto;
import com.petory.entity.Member;
import com.petory.entity.PaymentMethod;
import com.petory.repository.MemberRepository;
import com.petory.repository.PaymentMethodRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentService {

  private final MemberRepository memberRepository;
  private final PaymentMethodRepository paymentMethodRepository;

  @Value("${portone.api-key}")
  private String apiKey;

  @Value("${portone.api-secret}")
  private String apiSecret;

  // 아임포트(PortOne) 액세스 토큰 발급
  public String getPortoneAccessToken() {
    RestTemplate restTemplate = new RestTemplate();
    String url = "https://api.iamport.kr/users/getToken";
    JSONObject body = new JSONObject();
    body.put("imp_key", apiKey);
    body.put("imp_secret", apiSecret);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
    ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

    JSONObject json = new JSONObject(response.getBody());
    return json.getJSONObject("response").getString("access_token");
  }

  // 결제 정보 조회 및 검증
  public boolean verifyPortonePayment(String impUid, int expectedAmount) {
    String token = getPortoneAccessToken();
    RestTemplate restTemplate = new RestTemplate();
    String url = "https://api.iamport.kr/payments/" + impUid;

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);

    HttpEntity<Void> entity = new HttpEntity<>(headers);
    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

    JSONObject json = new JSONObject(response.getBody());
    JSONObject paymentInfo = json.getJSONObject("response");

    int amount = paymentInfo.getInt("amount");
    String status = paymentInfo.getString("status"); // paid, ready, cancelled 등

    // 결제 상태와 금액이 모두 일치해야 true
    return "paid".equals(status) && amount == expectedAmount;
  }

  // 아임포트(PortOne) 결제 환불(취소)
  public boolean cancelPortonePayment(String impUid, String reason) {
    String token = getPortoneAccessToken();
    RestTemplate restTemplate = new RestTemplate();
    String url = "https://api.iamport.kr/payments/cancel";

    org.json.JSONObject body = new org.json.JSONObject();
    body.put("imp_uid", impUid); // 또는 merchant_uid 사용 가능
    if (reason != null && !reason.isEmpty()) {
        body.put("reason", reason);
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setBearerAuth(token);

    HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
    ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

    org.json.JSONObject json = new org.json.JSONObject(response.getBody());
    // 성공 여부는 response.getStatusCode() 또는 json의 내용으로 판단
    // 아임포트 환불 성공 시 response에 "response" 객체가 포함됨
    return response.getStatusCode().is2xxSuccessful() && !json.isNull("response");
  }
  
  //////////////////////////////////////////////////////
  // 포트원이 말아먹은 자동 결제 시스템 모방 처리 메서드들/////////
  //////////////////////////////////////////////////////
  public void registerMockBillingKeyForCurrentUser() {
    // 1. 현재 로그인한 사용자 정보 조회
    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    // 2. 이미 등록된 결제 수단이 있는지 확인
    List<PaymentMethod> existingMethods = paymentMethodRepository.findByMember(member);
    if (!existingMethods.isEmpty()) {
      log.info("사용자(email: {})는 이미 결제 수단이 등록되어 있습니다.", userEmail);
      return;
    }

    // 3. 가짜 빌링키 생성
    String mockBillingKey = "mock_billing_" + UUID.randomUUID().toString();
    
    // 4. 랜덤 카드 정보 생성
    String[] cardTypes = {"신한카드", "KB국민카드", "삼성카드", "현대카드", "BC카드", "NH농협카드", "롯데카드", "우리카드"};
    String randomCardType = cardTypes[(int) (Math.random() * cardTypes.length)];
    
    // 랜덤 카드번호 생성 (4자리씩 4그룹)
    StringBuilder cardNumber = new StringBuilder();
    for (int i = 0; i < 4; i++) {
      if (i > 0) cardNumber.append(" ");
      cardNumber.append(String.format("%04d", (int) (Math.random() * 10000)));
    }
    
    String cardInfo = randomCardType + " (" + cardNumber.toString() + ")";
    
    log.info("사용자(email: {})에게 모의 결제 수단 생성: {}", userEmail, cardInfo);

    // 5. PaymentMethod 엔티티에 저장
    PaymentMethod paymentMethod = PaymentMethod.builder()
      .member(member)
      .billingKey(mockBillingKey)
      .cardInfo(cardInfo)
      .isDefault(true)
      .build();
    
    paymentMethodRepository.save(paymentMethod);
  }

  /**
   * 현재 사용자의 등록된 결제수단 정보를 조회하여 DTO로 반환합니다.
   * @return 등록된 정보가 있으면 DTO를, 없으면 null을 반환합니다.
   */
  @Transactional(readOnly = true)
  public PaymentMethodResponseDto getMyPaymentMethod() {
    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    List<PaymentMethod> paymentMethods = paymentMethodRepository.findByMember(member);
    
    if (!paymentMethods.isEmpty()) {
      PaymentMethod defaultMethod = paymentMethods.stream()
        .filter(PaymentMethod::isDefault)
        .findFirst()
        .orElse(paymentMethods.get(0));
      
      log.info("사용자(email: {})의 등록된 결제 수단 정보를 찾았습니다.", userEmail);
      
      // cardInfo에서 카드명과 카드번호 분리
      String cardInfo = defaultMethod.getCardInfo();
      String cardName = cardInfo;
      String cardNumber = "**** **** **** ****";
      
      if (cardInfo.contains("(") && cardInfo.contains(")")) {
        int startIndex = cardInfo.indexOf("(");
        int endIndex = cardInfo.indexOf(")");
        cardName = cardInfo.substring(0, startIndex).trim();
        String fullCardNumber = cardInfo.substring(startIndex + 1, endIndex);
        // 마지막 4자리만 표시
        String[] parts = fullCardNumber.split(" ");
        if (parts.length == 4) {
          cardNumber = "**** **** **** " + parts[3];
        }
      }
      
      return new PaymentMethodResponseDto(cardName, cardNumber);
    } else {
      log.info("사용자(email: {})에게 등록된 결제 수단이 없습니다.", userEmail);
      return null;
    }
  }

  /**
   * 현재 사용자의 결제 수단을 삭제합니다.
   */
  public void deleteMyPaymentMethod() {
    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    List<PaymentMethod> paymentMethods = paymentMethodRepository.findByMember(member);
    if (!paymentMethods.isEmpty()) {
      paymentMethodRepository.deleteAll(paymentMethods);
      log.info("사용자(email: {})의 결제 수단이 삭제되었습니다.", userEmail);
    }
  }
}
