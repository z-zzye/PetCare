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

    @GetMapping("/new")
    public String memberSignUpForm() {
        return "member/memberSignUp";
    }

    @GetMapping("/login")
    public String loginForm() {
        return "member/memberLogin";
    }
}
