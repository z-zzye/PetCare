package com.petory.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                      HttpServletResponse response, 
                                      Authentication authentication) throws IOException, ServletException {
        
        HttpSession session = request.getSession();
        
        // 세션에 NEED_PHONE_INPUT 플래그가 있는지 확인
        Boolean needPhoneInput = (Boolean) session.getAttribute("NEED_PHONE_INPUT");
        
        if (needPhoneInput != null && needPhoneInput) {
            // 플래그를 제거하고 전화번호 입력 페이지로 리다이렉트
            session.removeAttribute("NEED_PHONE_INPUT");
            response.sendRedirect("/phone-input");
        } else {
            // 일반적인 경우 메인 페이지로 리다이렉트
            response.sendRedirect("/");
        }
    }
} 