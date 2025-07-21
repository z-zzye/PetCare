package com.petory.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.petory.config.CustomUserDetails;
import com.petory.config.JwtTokenProvider;
import com.petory.dto.AddressUpdateDto;
import com.petory.dto.ChatMemberDto;
import com.petory.dto.HashtagDto;
import com.petory.dto.LoginDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.dto.ResetPasswordDto;
import com.petory.dto.SocialCheckDto;
import com.petory.dto.member.MemberDto;
import com.petory.dto.member.MemberFormDto;
import com.petory.dto.member.MemberUpdateDto;
import com.petory.entity.Member;
import com.petory.service.MemberService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

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
            Member savedMember = memberService.join(memberFormDto);
            return ResponseEntity.ok(Map.of(
                "message", "회원가입이 완료되었습니다!",
                "memberId", savedMember.getMember_Id()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("회원가입 중 오류가 발생했습니다.");
        }
    }

    // 소셜 로그인 후 추가정보(전화번호) 입력
    @PostMapping("/update-phone")
    public ResponseEntity<?> updatePhone(@RequestBody PhoneUpdateDto phoneUpdateDto, @RequestHeader("Authorization") String authHeader) {
        try {
            memberService.updatePhone(phoneUpdateDto);
            // 전화번호 업데이트 후 memberId를 리턴
            String token = authHeader.substring(7); // "Bearer " 제거
            String email = jwtTokenProvider.getEmail(token);
            Member member = memberService.getMemberByEmail(email);
            return ResponseEntity.ok(Map.of(
                "message", "전화번호가 성공적으로 업데이트되었습니다.",
                "memberId", member.getMember_Id()
            ));
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
                "nickname", member.getMember_NickName(),
                "memberId", member.getMember_Id() //추가 - 결제 검증때 필요

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

    // 마일리지 조회
    @GetMapping("/mileage")
    public ResponseEntity<?> getMileage(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // "Bearer " 제거
            String email = jwtTokenProvider.getEmail(token);
            Member member = memberService.getMemberByEmail(email);
            Integer mileage = member.getMember_Mileage();
            return ResponseEntity.ok(Map.of("mileage", mileage));
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
    /*이메일로 소셜로그인 유저인지 체크*/
    @GetMapping("/check-social/{email}")
    public ResponseEntity<?> checkIfSocialUser(@PathVariable String email) {
      try {
        Member member = memberService.getMemberByEmail(email);
        return ResponseEntity.ok(new SocialCheckDto(member));
      } catch (IllegalStateException e) {
        return ResponseEntity.status(404).body("회원 정보를 찾을 수 없습니다.");
      }
    }

    /*이메일로 유저아이디 조회*/
    @GetMapping("/id-by-email") // 중복 매핑 방지: /api/members 경로는 @RequestMapping 에 이미 있음
    public ResponseEntity<Long> getMemberIdByEmail(@RequestParam String email) {
      System.out.println("⭐이메일로 아이디 찾기 :: 넘어온 이메일"+email);
      Member member = memberService.getMemberByEmail(email); // ✅ Service를 통해 조회
      return ResponseEntity.ok(member.getMember_Id()); // 정확한 필드명
    }


    /*멤버 업데이트*/
    @PutMapping(value = "/update", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateMember(
      @RequestPart("data") @Valid MemberUpdateDto dto,
      @RequestPart(value = "member_ProfileImgFile", required = false) MultipartFile file,
      BindingResult bindingResult
    ) {
      if (bindingResult.hasErrors()) {
        String errorMsg = bindingResult.getFieldErrors().stream()
          .map(FieldError::getDefaultMessage)
          .collect(Collectors.joining("\n"));
        return ResponseEntity.badRequest().body(errorMsg);
      }

      try {
        dto.setMember_ProfileImgFile(file);

        memberService.updateMember(dto);
        return ResponseEntity.ok("회원 정보가 성공적으로 업데이트되었습니다.");
      } catch (IllegalStateException e) {
        return ResponseEntity.status(409).body(e.getMessage());
      } catch (Exception e) {
        return ResponseEntity.status(500).body("회원 정보 업데이트 중 오류가 발생했습니다.");
      }
    }

    // 회원 해시태그 저장
    @PostMapping("/{memberId}/hashtags")
    public ResponseEntity<?> saveMemberHashtags(
      @PathVariable Long memberId,
      @RequestBody Map<String, Object> request
    ) {
      try {
        @SuppressWarnings("unchecked")
        List<String> hashtagNames = (List<String>) request.get("hashtags");
        memberService.saveMemberHashtags(memberId, hashtagNames);
        return ResponseEntity.ok("관심사항이 성공적으로 저장되었습니다.");
      } catch (IllegalStateException e) {
        return ResponseEntity.status(404).body(e.getMessage());
      } catch (Exception e) {
        return ResponseEntity.status(500).body("관심사항 저장 중 오류가 발생했습니다.");
      }
    }

    // 회원 해시태그 조회
    @GetMapping("/{memberId}/hashtags")
    public ResponseEntity<?> getMemberHashtags(@PathVariable Long memberId) {
      try {
        List<HashtagDto> hashtags = memberService.getMemberHashtags(memberId);
        return ResponseEntity.ok(hashtags);
      } catch (IllegalStateException e) {
        return ResponseEntity.status(404).body(e.getMessage());
      } catch (Exception e) {
        return ResponseEntity.status(500).body("관심사항 조회 중 오류가 발생했습니다.");
      }
    }

    @GetMapping("/info")
    public ResponseEntity<MemberDto> getMemberInfo(@RequestParam String email) {
      try {
        Member member = memberService.getMemberByEmail(email);
        MemberDto dto = MemberDto.from(member); // 응답에 필요한 필드만 추려서 반환
        return ResponseEntity.ok(dto);
      } catch (Exception e) {
        return ResponseEntity.status(404).body(null);
      }
    }

  // MemberController.java
  @GetMapping("/nickname/{memberId}")
  public ResponseEntity<String> getNickname(@PathVariable Long memberId) {
    Member member = memberService.getMemberById(memberId);
    return ResponseEntity.ok(member.getMember_NickName());
  }

  // 채팅방 아이디 찾기
  @GetMapping("/public/{id}")
  public ResponseEntity<ChatMemberDto> getPublicMember(@PathVariable Long id) {
    return ResponseEntity.ok(memberService.getChatMemberById(id));
  }

  // 회원 역할 조회
  @GetMapping("/{memberId}/role")
  public ResponseEntity<String> getMemberRole(@PathVariable Long memberId) {
    try {
      String role = memberService.getMemberRole(memberId);
      return ResponseEntity.ok(role);
    } catch (IllegalStateException e) {
      return ResponseEntity.status(404).body(e.getMessage());
    } catch (Exception e) {
      return ResponseEntity.status(500).body("역할 조회 중 오류가 발생했습니다.");
    }
  }

  // 자동 예약 신청 시 지정한 지도 좌표 멤버 엔티티에 저장
  @PostMapping("/update-address")
  public ResponseEntity<Void> updateAddress(
          @RequestBody AddressUpdateDto dto,
          @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
      if (userDetails == null) {
          return ResponseEntity.status(401).build(); // 인증 실패
      }
      Member member = userDetails.getMember();
      memberService.updateAddress(member, dto.getLat(), dto.getLng());
      return ResponseEntity.ok().build();
  }

}
