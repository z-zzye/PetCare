package com.petory.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.stereotype.Component;
import java.util.*;
import javax.crypto.SecretKey;

@Component
public class JwtTokenProvider {
    // 32바이트(256비트) 이상 Base64 인코딩된 시크릿 키
    private final String secretKey = "cGV0b3J5LXN1cGVyLXNlY3JldC1rZXktZm9yLWp3dC0yMDI0ISE=";
    private final long validityInMilliseconds = 3600000; // 1시간

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    public String createToken(String email, List<String> roles) {
        Claims claims = Jwts.claims().setSubject(email);
        claims.put("roles", roles);
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);
        SecretKey key = getSigningKey();
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getEmail(String token) {
        SecretKey key = getSigningKey();
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().getSubject();
    }

    /*public boolean validateToken(String token) {
        try {
            SecretKey key = getSigningKey();
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }*/

  public boolean validateToken(String token) {
    try {
      SecretKey key = getSigningKey();
      Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      return true;
    } catch (ExpiredJwtException e) {
      System.out.println("[JWT] 만료된 토큰입니다.");
    } catch (UnsupportedJwtException e) {
      System.out.println("[JWT] 지원하지 않는 토큰입니다.");
    } catch (MalformedJwtException e) {
      System.out.println("[JWT] 잘못된 형식의 토큰입니다.");
    } catch (SignatureException e) {
      System.out.println("[JWT] 서명이 올바르지 않습니다.");
    } catch (IllegalArgumentException e) {
      System.out.println("[JWT] 잘못된 토큰입니다.");
    }
    return false;
  }
}
