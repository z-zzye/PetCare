package com.petory.controller;

import com.petory.dto.MemberFormDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.entity.Member;
import com.petory.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RequestMapping("/members")
@Controller
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

    @GetMapping("/new")
    public String memberSignUpForm(Model model) {
        model.addAttribute("memberFormDto", new MemberFormDto());
        return "member/memberSignUp";
    }

    @PostMapping("/new")
    public String memberSignUp(@Valid MemberFormDto memberFormDto, 
                              BindingResult bindingResult, 
                              Model model,
                              RedirectAttributes redirectAttributes) {
        
        if (bindingResult.hasErrors()) {
            return "member/memberSignUp";
        }

        try {
            Member member = memberService.join(memberFormDto);
            redirectAttributes.addFlashAttribute("message", "회원가입이 완료되었습니다!");
            return "redirect:/members/login";
        } catch (IllegalStateException e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "member/memberSignUp";
        } catch (Exception e) {
            model.addAttribute("errorMessage", "회원가입 중 오류가 발생했습니다.");
            return "member/memberSignUp";
        }
    }

    @GetMapping("/login")
    public String loginForm() {
        return "member/memberLogin";
    }

    /**
     * 소셜 로그인 후 추가 정보 입력 페이지
     */
    @GetMapping("/memberSocialExtra")
    public String memberSocialExtra(Model model) {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/members/login";
        }

        // OAuth2User에서 이메일 정보 가져오기
        String email = null;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User = 
                (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
            
            // 네이버, 카카오, 구글 등에서 이메일 추출
            Map<String, Object> attributes = oauth2User.getAttributes();
            if (attributes.containsKey("response")) {
                // 네이버
                Map<String, Object> response = (Map<String, Object>) attributes.get("response");
                email = (String) response.get("email");
            } else if (attributes.containsKey("kakao_account")) {
                // 카카오
                Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
                email = (String) kakaoAccount.get("email");
            } else {
                // 구글 등 기타
                email = (String) attributes.get("email");
            }
        } else {
            // 일반 로그인의 경우
            email = authentication.getName();
        }

        // 디버깅: 이메일 정보 출력
        System.out.println("Extracted email: " + email);

        if (email == null) {
            return "redirect:/";
        }

        // 현재 로그인한 사용자 정보를 모델에 추가
        Member member = memberService.getMemberByEmail(email);
        model.addAttribute("member", member);

        return "member/memberSocialExtra";
    }

    /**
     * 전화번호 업데이트 처리
     */
    @PostMapping("/update-phone")
    public String updatePhone(PhoneUpdateDto phoneUpdateDto, RedirectAttributes redirectAttributes) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = null;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User = 
                (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oauth2User.getAttributes();
            // registrationId를 세션에서 꺼내거나, provider를 추론해야 함 (여기선 구글/네이버/카카오 모두 지원)
            String provider = null;
            Object regAttr = authentication.getAuthorities().stream().findFirst().orElse(null);
            if (attributes.containsKey("response")) provider = "naver";
            else if (attributes.containsKey("kakao_account")) provider = "kakao";
            else provider = "google";
            email = com.petory.config.CustomOAuth2UserService.extractEmail(provider, attributes);
        } else {
            email = authentication.getName();
        }

        if (email == null) {
            redirectAttributes.addFlashAttribute("error", "사용자 정보를 찾을 수 없습니다.");
            return "redirect:/members/memberSocialExtra";
        }

        try {
            memberService.updatePhoneByEmail(email, phoneUpdateDto.getPhone());
            redirectAttributes.addFlashAttribute("message", "전화번호가 성공적으로 업데이트되었습니다.");
            return "redirect:/";
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/members/memberSocialExtra";
        }
    }

    /**
     * 프로필 이미지를 표시하는 메서드
     */
    @GetMapping("/profile-image/{fileName}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get("uploads/profile-images/" + fileName);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG) // 또는 적절한 미디어 타입
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
