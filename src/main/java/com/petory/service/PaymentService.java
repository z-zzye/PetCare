package com.petory.service;

import com.petory.dto.autoReservation.PaymentMethodResponseDto;
import lombok.extern.slf4j.Slf4j;
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

import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import com.petory.repository.PaymentMethodRepository;

import lombok.RequiredArgsConstructor;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentService {

  private final MemberRepository memberRepository;

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
    Member member = memberRepository.findByMember_Email(userEmail) // 메서드명 확인 필요
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    // 2. 이미 등록된 정보가 있는지 확인 (선택 사항)
    if (member.getCustomerUid() != null && !member.getCustomerUid().isBlank()) {
      log.info("사용자(email: {})는 이미 결제 수단이 등록되어 있습니다.", userEmail);
      // 이미 키가 있다면 아무것도 하지 않거나, 필요시 예외를 발생시킬 수 있습니다.
      // 여기서는 그냥 성공한 것처럼 처리합니다.
      return;
    }

    // 3. 가짜 빌링키 생성 (예: mock_billing_랜덤UUID)
    String mockBillingKey = "mock_billing_" + UUID.randomUUID().toString();
    log.info("사용자(email: {})에게 모의 빌링키 생성: {}", userEmail, mockBillingKey);

    // 4. Member 엔티티에 customer_uid(빌링키) 저장
    member.setCustomerUid(mockBillingKey); // Member 엔티티에 setCustomerUid 필요
    memberRepository.save(member);
  }

  /**
   * [신규 로직] 현재 사용자의 등록된 결제수단 정보를 조회하여 DTO로 반환합니다.
   * @return 등록된 정보가 있으면 DTO를, 없으면 null을 반환합니다.
   */
  @Transactional(readOnly = true)
  public PaymentMethodResponseDto getMyPaymentMethod() {
    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    String customerUid = member.getCustomerUid();

    if (customerUid != null && !customerUid.isBlank()) {
      // 실제라면 DB나 포트원에서 카드 정보를 가져오겠지만, 지금은 모킹이므로 가짜 정보를 만듭니다.
      log.info("사용자(email: {})의 등록된 결제 수단 정보를 찾았습니다.", userEmail);
      return new PaymentMethodResponseDto("등록된 카드", "**** 1234");
    } else {
      log.info("사용자(email: {})에게 등록된 결제 수단이 없습니다.", userEmail);
      return null;
    }
  }

}
