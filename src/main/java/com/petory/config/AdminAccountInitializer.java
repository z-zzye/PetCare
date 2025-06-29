package com.petory.config;

import com.petory.entity.Member;
import com.petory.constant.Role;
import com.petory.repository.MemberRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer {

  private final MemberRepository memberRepository;
  private final PasswordEncoder passwordEncoder;

  @PostConstruct
  public void initAdminAccount() {
    String adminEmail = "admin@petory.com";
    if (memberRepository.findByMember_Email(adminEmail).isEmpty()) {
      Member admin = Member.builder()
        .member_Email(adminEmail)
        .member_Pw(passwordEncoder.encode("admin1234"))
        .member_Role(Role.ADMIN)
        .member_NickName("관리자")
        .member_Phone("010-0000-0000")
        .member_ProfileImg(null)
        .member_Mileage(0)
        .member_Address("서울")
        .build();
      memberRepository.save(admin);
      System.out.println("✅ Admin 계정 생성 완료: " + adminEmail);
    } else {
      System.out.println("ℹ️ Admin 계정 이미 존재: " + adminEmail);
    }
  }
}

