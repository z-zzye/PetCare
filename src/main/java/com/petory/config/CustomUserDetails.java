package com.petory.config;

import com.petory.entity.Member;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

  private final Member member;

  public CustomUserDetails(Member member) {
    this.member = member;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    // ex) ROLE_USER, ROLE_ADMIN
    return Collections.singleton(new SimpleGrantedAuthority(member.getMember_Role().toString()));
  }

  @Override
  public String getPassword() {
    return member.getMember_Pw(); // SOCIAL_LOGIN일 수도 있음
  }

  @Override
  public String getUsername() {
    return member.getMember_Email(); // 또는 member.getId().toString()
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }
}
