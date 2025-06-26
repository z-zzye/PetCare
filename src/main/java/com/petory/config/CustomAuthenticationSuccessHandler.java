package com.petory.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.core.user.OAuth2User;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import java.util.Map;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                      HttpServletResponse response, 
                                      Authentication authentication) throws IOException, ServletException {
        HttpSession session = request.getSession();
        Boolean needPhoneInput = (Boolean) session.getAttribute("NEED_PHONE_INPUT");
        String email = null;
        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            String provider;
            if (oauth2User.getAttributes().containsKey("response")) {
                provider = "naver";
            } else if (oauth2User.getAttributes().containsKey("kakao_account")) {
                provider = "kakao";
            } else {
                provider = "google";
            }
            if ("naver".equals(provider)) {
                Map<String, Object> responseMap = (Map<String, Object>) oauth2User.getAttributes().get("response");
                email = (String) responseMap.get("email");
            } else if ("kakao".equals(provider)) {
                Map<String, Object> kakaoAccount = (Map<String, Object>) oauth2User.getAttributes().get("kakao_account");
                email = (String) kakaoAccount.get("email");
            } else {
                email = (String) oauth2User.getAttributes().get("email");
            }
        } else {
            email = authentication.getName();
        }
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        String token = jwtTokenProvider.createToken(email, roles);
        String redirectUrl = "http://localhost:3000/oauth2/redirect?token=" + token;
        if (needPhoneInput != null && needPhoneInput) {
            session.removeAttribute("NEED_PHONE_INPUT");
            redirectUrl += "&needPhoneInput=true";
        }
        response.sendRedirect(redirectUrl);
    }
} 