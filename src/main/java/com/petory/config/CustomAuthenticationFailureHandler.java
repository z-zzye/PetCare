package com.petory.config;

import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;

import java.io.IOException;
import java.net.URLEncoder;

@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler{
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException {
        String errorMsg = null;
        if (exception instanceof org.springframework.security.oauth2.core.OAuth2AuthenticationException oauth2Ex) {
            // OAuth2AuthenticationException의 경우 description에서 메시지 추출
            errorMsg = oauth2Ex.getError().getDescription();
        }
        if (errorMsg == null || errorMsg.trim().isEmpty()) {
            errorMsg = exception.getMessage();
        }
        if (errorMsg == null || errorMsg.trim().isEmpty()) {
            errorMsg = "알 수 없는 인증 오류가 발생했습니다.";
        }
        errorMsg = URLEncoder.encode(errorMsg, "UTF-8");
        response.sendRedirect("http://localhost:3000/members/login?error=" + errorMsg);
    }
    
}
