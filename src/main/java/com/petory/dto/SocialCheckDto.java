package com.petory.dto;

import com.petory.entity.Member;
import lombok.Getter;

@Getter
public class SocialCheckDto {
  private final String email;
  private final boolean isSocial;

  public SocialCheckDto(Member member) {
    this.email = member.getMember_Email();
    this.isSocial = "SOCIAL_LOGIN".equals(member.getMember_Pw());
  }
}
