package com.petory.controller;

import com.petory.service.SmsService;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sms")
public class SmsController {

  private final SmsService smsService;

  // 인증번호 전송
  @PostMapping("/send")
  public ResponseEntity<String> sendSms(@RequestBody Map<String, String> payload, HttpSession session) {
    String phone = payload.get("phone");
    String code = generateCode();

    smsService.sendSms(phone, code);

    // 인증코드 세션 저장
    session.setAttribute("authCode", code);
    session.setAttribute("authCodeTime", System.currentTimeMillis());

    return ResponseEntity.ok("인증번호 전송 완료");
  }

  // 🔽 인증코드 확인 (요거 추가!)
  @PostMapping("/verify")
  public ResponseEntity<String> verifyCode(@RequestBody Map<String, String> payload, HttpSession session) {
    String inputCode = payload.get("code");

    String savedCode = (String) session.getAttribute("authCode");
    Long savedTime = (Long) session.getAttribute("authCodeTime");

    if (savedCode == null || savedTime == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증코드가 존재하지 않습니다.");
    }

    // 3분 초과 확인
    long elapsed = System.currentTimeMillis() - savedTime;
    if (elapsed > 180_000) {
      session.removeAttribute("authCode");
      session.removeAttribute("authCodeTime");
      return ResponseEntity.status(HttpStatus.GONE).body("인증코드가 만료되었습니다.");
    }

    if (savedCode.equals(inputCode)) {
      session.removeAttribute("authCode");
      session.removeAttribute("authCodeTime");
      return ResponseEntity.ok("인증 성공");
    } else {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증코드가 일치하지 않습니다.");
    }
  }

  // 랜덤 인증코드 생성
  private String generateCode() {
    return String.valueOf((int) ((Math.random() * 900000) + 100000));
  }
}

