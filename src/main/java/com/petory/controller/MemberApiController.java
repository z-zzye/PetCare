package com.petory.controller;

import com.petory.dto.MemberFormDto;
import com.petory.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberApiController {
    private final MemberService memberService;

    // 회원가입 데이터 처리를 위한 POST 메서드
    @PostMapping("/join")
    public ResponseEntity<?> join(@Valid @ModelAttribute MemberFormDto memberFormDto, BindingResult bindingResult) {

        // DTO의 유효성 검사(@NotBlank, @Email 등)에 실패했을 경우
        if (bindingResult.hasErrors()) {
            // 에러 메시지들을 하나의 문자열로 합쳐서 클라이언트에게 전달
            String errorMsg = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.joining("\n"));
            return ResponseEntity.badRequest().body(errorMsg);
        }

        try {
            // 서비스 로직 호출
            memberService.join(memberFormDto);
            // 성공 시, 성공 메시지와 함께 200 OK 응답 반환
            return ResponseEntity.ok().body("회원가입이 성공적으로 완료되었습니다.");

        } catch (IllegalStateException e) {
            // 서비스 로직에서 발생한 예외(이메일, 닉네임 중복 등) 처리
            // 에러 메시지와 함께 409 Conflict(자원 충돌) 상태 코드 반환
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            // 기타 예외 처리
            return ResponseEntity.status(500).body("회원가입 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
