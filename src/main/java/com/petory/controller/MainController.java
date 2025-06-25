package com.petory.controller;

import com.petory.dto.PhoneUpdateDto;
import com.petory.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class MainController {

    private final MemberService memberService;

    @GetMapping("/")
    public String main() {
        return "test";
    }

    /**
     * 전화번호 입력 페이지로 이동
     */
    @GetMapping("/phone-input")
    public String phoneInputPage(Model model) {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return "redirect:/members/login";
        }

        return "phoneInput";
    }

    /**
     * 전화번호 업데이트 처리
     */
    @PostMapping("/update-phone")
    public String updatePhone(PhoneUpdateDto phoneUpdateDto, RedirectAttributes redirectAttributes) {
        try {
            memberService.updatePhone(phoneUpdateDto);
            redirectAttributes.addFlashAttribute("message", "전화번호가 성공적으로 업데이트되었습니다.");
            return "redirect:/";
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/phone-input";
        }
    }
}
