package com.petory.controller;

import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import com.petory.service.MailService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private MailService mailService;
    @Autowired
    private MemberRepository memberRepository;

    @PostMapping("/send-code")
    public ResponseEntity<String> sendEmailCode(@RequestParam String email, HttpSession session) {
        // 🔍 1. 이메일로 사용자 조회
        Member member = memberRepository.findByMember_Email(email).orElse(null);

        // ✅ 2. 소셜 로그인 사용자라면 거부
        if (member != null && "SOCIAL_LOGIN".equals(member.getMember_Pw())) {
          return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("소셜 로그인 사용자는 이용할 수 없습니다.");
        }


        String code = mailService.createCode();
        mailService.sendAuthCode(email, code);
        session.setAttribute("emailAuthCode", code);
        session.setAttribute("emailAuthTarget", email);
        return ResponseEntity.ok("인증코드 발송됨");
    }

    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(@RequestParam String email,
                                             @RequestParam String code,
                                             HttpSession session) {
        String savedCode = (String) session.getAttribute("emailAuthCode");
        String savedEmail = (String) session.getAttribute("emailAuthTarget");
        if (savedCode != null && savedEmail != null
                && savedEmail.equals(email) && savedCode.equalsIgnoreCase(code)) {
            return ResponseEntity.ok("인증 성공");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 실패");
        }
    }
}
