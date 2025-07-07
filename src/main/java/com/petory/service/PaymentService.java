package com.petory.service;

import com.petory.entity.Member;
import com.petory.entity.PaymentMethod;
import com.petory.repository.MemberRepository;
import com.petory.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.json.JSONObject;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

  private final MemberRepository memberRepository;
  private final PaymentMethodRepository paymentMethodRepository;

  @Value("${portone.api-key}")
  private String apiKey;

  @Value("${portone.api-secret}")
  private String apiSecret;

  public void issueBillingKeyAndSave(String impUid) {
    // 1. 포트원 API 호출을 위한 액세스 토큰 발급
    String token = getPortoneAccessToken();
    RestTemplate restTemplate = new RestTemplate();
    String url = "https://api.iamport.kr/payments/" + impUid;

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);

    // 2. imp_uid로 포트원에 결제(인증) 정보 요청
    HttpEntity<Void> entity = new HttpEntity<>(headers);
    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

    JSONObject json = new JSONObject(response.getBody());
    JSONObject paymentInfo = json.getJSONObject("response");

    // 3. 인증 정보 검증 (상태가 'paid'이고, 금액이 0원인지 확인)
    String status = paymentInfo.getString("status");
    int amount = paymentInfo.getInt("amount");

    if ("paid".equals(status) && amount == 0) {
      // 4. 검증 성공 시 customer_uid 추출
      String customerUid = paymentInfo.getString("customer_uid");

      // 5. 현재 로그인한 사용자 정보 조회
      String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
      Member member = memberRepository.findByMember_Email(userEmail)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

      // 6. Member 엔티티에 customer_uid(빌링키) 저장
      member.setCustomerUid(customerUid); // Member 엔티티에 setCustomerUid 필요
      memberRepository.save(member);

    } else {
      // 4-1. 검증 실패 시 예외 발생
      throw new IllegalStateException("카드 인증 정보 검증에 실패했습니다. 상태: " + status + ", 금액: " + amount);
    }
  }

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

}
