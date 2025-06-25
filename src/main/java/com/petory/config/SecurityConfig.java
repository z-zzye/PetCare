package com.petory.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 보호 기능을 비활성화합니다.
                .csrf(csrf -> csrf.disable())
                // 1. 요청 경로별 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 아래 경로들은 인증(로그인) 없이 접근 허용
                        .requestMatchers(
                                "/",
                                "/error",
                                "/favicon.ico",
                                "/css/**", "/js/**", "/img/**", "/images/**", // 정적 자원
                                "/members/login",     // 로그인 페이지
                                "/members/login/process",
                                "/members/new",       // 회원가입 페이지
                                "/api/members/join",   // 회원가입 API (이전 단계에서 만듦)
                                // 테스트용 경로 지정 (추후 삭제 예정)
                                "/test/cleanbot",      // 테스트 페이지 경로 허용
                                "/api/test/cleanbot"   // 테스트 API 경로 허용
                        ).permitAll()
                        // "/admin/**" 경로는 "ADMIN" 역할을 가진 사용자만 접근 가능
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                // 2. Form 기반 로그인 설정
                .formLogin(form -> form
                        .loginPage("/members/login")             // 커스텀 로그인 페이지 경로
                        .loginProcessingUrl("/members/login/process")            // 로그인 처리 경로 (HTML form의 action과 일치)
                        .usernameParameter("member_email")       // 로그인 폼의 아이디 input name
                        .passwordParameter("member_pw")          // 로그인 폼의 비밀번호 input name
                        .defaultSuccessUrl("/")                  // 로그인 성공 시 이동할 기본 경로
                        .failureUrl("/members/login?error=true") // 로그인 실패 시 이동할 경로
                )

                // 3. 소셜 로그인(OAuth2) 설정
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/members/login") // 소셜 로그인을 시도할 때도 이 페이지를 거치도록 설정
                        .successHandler(customAuthenticationSuccessHandler) // 커스텀 성공 핸들러 사용
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // 사용자 정보를 가져온 후 처리할 서비스
                        )
                )

                // 4. 로그아웃 설정
                .logout(logout -> logout
                        .logoutRequestMatcher(new AntPathRequestMatcher("/members/logout"))
                        .logoutSuccessUrl("/")
                        .invalidateHttpSession(true) // 세션 무효화
                );

        // 참고: CSRF는 기본적으로 활성화되어 있습니다.
        // Thymeleaf를 통해 form을 제출하면 CSRF 토큰이 자동으로 포함되므로 보안상 끄지 않는 것을 권장합니다.

        return http.build();
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
