package com.petory.controller;

import com.petory.dto.MemberFormDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.entity.Member;
import com.petory.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.petory.dto.LoginDto;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import com.petory.config.JwtTokenProvider;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.petory.dto.ResetPasswordDto;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberApiController {
    private final MemberService memberService;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // 회원가입 (JSON + 파일 업로드)
    @PostMapping(value = "/signup", consumes = {"multipart/form-data"})
    public ResponseEntity<?> signUp(
            @RequestPart("data") @Valid MemberFormDto memberFormDto,
            @RequestPart(value = "member_ProfileImgFile", required = false) MultipartFile profileImgFile,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.joining("\n"));
            return ResponseEntity.badRequest().body(errorMsg);
        }
        try {
            memberFormDto.setMember_ProfileImgFile(profileImgFile);
            memberService.join(memberFormDto);
            return ResponseEntity.ok("회원가입이 완료되었습니다!");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("회원가입 중 오류가 발생했습니다.");
        }
    }

    // 소셜 로그인 후 추가정보(전화번호) 입력
    @PostMapping("/update-phone")
    public ResponseEntity<?> updatePhone(@RequestBody PhoneUpdateDto phoneUpdateDto) {
        try {
            memberService.updatePhone(phoneUpdateDto);
            return ResponseEntity.ok("전화번호가 성공적으로 업데이트되었습니다.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("전화번호 업데이트 중 오류가 발생했습니다.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        Member member = null;
        try {
            member = memberService.getMemberByEmail(loginDto.getEmail());
            if ("SOCIAL_LOGIN".equals(member.getMember_Pw())) {
              return ResponseEntity.status(401).body("소셜 로그인 사용자입니다.");
            }
            UserDetails userDetails = userDetailsService.loadUserByUsername(loginDto.getEmail());

            // 소셜 로그인 회원인지 확인
            if ("SOCIAL_LOGIN".equals(userDetails.getPassword())) {
                return ResponseEntity.status(401).body("소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해 주세요.");
            }

            if (!passwordEncoder.matches(loginDto.getPassword(), userDetails.getPassword())) {
                return ResponseEntity.status(401).body("비밀번호가 일치하지 않습니다.");
            }
            String token = jwtTokenProvider.createToken(userDetails.getUsername(), userDetails.getAuthorities().stream().map(a -> a.getAuthority()).toList());

            //로그인 한 사용자 정보 조회
            member = memberService.getMemberByEmail(loginDto.getEmail());
            System.out.println("로그인 시도 이메일: " + loginDto.getEmail());
            if (member != null) {
                System.out.println("가져온 member_ProfileImg: " + member.getMember_ProfileImg());
            } else {
                System.out.println("Member 객체가 null입니다!");
            }

            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", member.getMember_Role().name(),
                "profileImg", member.getMember_ProfileImg() != null ? member.getMember_ProfileImg() : "",
                "nickname", member.getMember_NickName()
            ));
        } catch (Exception e) {
            System.out.println("로그인 실패 예외: " + e.getMessage());
            return ResponseEntity.status(401).body("로그인 실패: " + e.getMessage());
        }
    }

    // 현재 로그인한 사용자 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // "Bearer " 제거
            String email = jwtTokenProvider.getEmail(token);
            Member member = memberService.getMemberByEmail(email);
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증 실패: " + e.getMessage());
        }
    }

    // 휴대폰 번호로 아이디 조회
    @PostMapping("/find-id")
    public ResponseEntity<String> findIdByPhone(@RequestBody Map<String, String> payload) {
      String phone = payload.get("phone");
      Member member = memberService.getMemberByPhone(phone);
      if (member != null) {
        return ResponseEntity.ok(member.getMember_Email());
      } else {
        return ResponseEntity.status(404).body("해당 번호로 등록된 계정이 없습니다.");
      }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDto dto) {
        try {
            memberService.resetPassword(dto.getEmail(), dto.getNewPassword());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("비밀번호 변경 중 오류가 발생했습니다.");
        }
    }
}
