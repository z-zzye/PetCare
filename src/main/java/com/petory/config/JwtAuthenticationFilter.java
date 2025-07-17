package com.petory.config;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtTokenProvider jwtTokenProvider;
  private final UserDetailsService userDetailsService;

  public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
    this.jwtTokenProvider = jwtTokenProvider;
    this.userDetailsService = userDetailsService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
    throws ServletException, IOException {

    System.out.println("==== [JWT Filter] API 요청 필터링 시작: " + request.getRequestURI() + " ====");
    System.out.println("[JWT Filter] Authorization 헤더: " + request.getHeader("Authorization"));

    // 1. 헤더에서 토큰을 가져옵니다.
    String token = resolveToken(request);

    if (token != null) {
      System.out.println("[JWT Filter] 토큰 발견: " + token.substring(0, Math.min(20, token.length())) + "...");

      // 2. 토큰 유효성 검사
      if (jwtTokenProvider.validateToken(token)) {
        System.out.println("[JWT Filter] 토큰이 유효합니다.");

        // 3. 토큰에서 이메일(사용자 정보) 추출
        String email = jwtTokenProvider.getEmail(token);
        System.out.println("[JWT Filter] 토큰에서 이메일 추출: " + email);

        // 4. 이메일로 DB에서 사용자 정보 조회
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        System.out.println("[JWT Filter] DB에서 사용자 정보 조회 성공: " + userDetails.getUsername());

        // 5. 인증 객체 생성 및 SecurityContext에 저장
        UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        System.out.println("[JWT Filter] SecurityContext에 인증 정보 저장 완료!");

      } else {
        System.out.println("[JWT Filter] 토큰이 유효하지 않습니다.");
      }
    } else {
      System.out.println("[JWT Filter] Authorization 헤더에 토큰이 없습니다.");
    }

    filterChain.doFilter(request, response);
  }

  private String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return null;
  }


}
