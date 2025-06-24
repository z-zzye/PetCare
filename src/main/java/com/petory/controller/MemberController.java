package com.petory.controller;

import com.petory.dto.MemberFormDto;
import com.petory.entity.Member;
import com.petory.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/members")
@Controller
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping(value = "/new")
    private String memberForm(Model model) {
        model.addAttribute("memberFormDto", new MemberFormDto());
        return "member/memberForm";
    }

    @PostMapping(value = "/new")
    public String memberForm(@Valid MemberFormDto memberFormDto, BindingResult bindingResult, Model model) {
        if (bindingResult.hasErrors()) {
            return "member/memberForm";
        }
        try {
            Member member = Member.createMember(memberFormDto, passwordEncoder);

            // 프로필 이미지 처리
            if (!memberFormDto.getProfileImageFile().isEmpty()) {
                String savedFileName = fileService.saveProfileImage(memberFormDto.getProfileImageFile());
                member.setProfileImg(savedFileName);
            }
            // 데이터베이스에 저장
            memberService.saveMember(member);
        } catch (IllegalStateException e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "member/memberForm";
        }
        return "redirect:/";
    }
}
