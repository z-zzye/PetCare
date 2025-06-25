package com.petory.controller;

import com.petory.dto.MemberFormDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.entity.Member;
import com.petory.service.MemberService;
import com.petory.config.CustomOAuth2UserService;
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
    private final CustomOAuth2UserService oAuth2UserService;

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
    public String memberSocialExtra(Model model, Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/members/login";
        }
        String email;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User oauth2User) {
            Map<String, Object> attributes = oauth2User.getAttributes();
            String provider = oAuth2UserService.extractProvider(attributes);
            email = oAuth2UserService.extractEmail(provider, attributes);
        } else {
            email = authentication.getName();
        }
        if (email == null) {
            return "redirect:/";
        }
        Member member = memberService.getMemberByEmail(email);
        model.addAttribute("member", member);
        return "member/memberSocialExtra";
    }

    /**
     * 전화번호 업데이트 처리
     */
    @PostMapping("/update-phone")
    public String updatePhone(PhoneUpdateDto phoneUpdateDto, RedirectAttributes redirectAttributes, Authentication authentication) {
        String email;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User oauth2User) {
            Map<String, Object> attributes = oauth2User.getAttributes();
            String provider = oAuth2UserService.extractProvider(attributes);
            email = oAuth2UserService.extractEmail(provider, attributes);
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
