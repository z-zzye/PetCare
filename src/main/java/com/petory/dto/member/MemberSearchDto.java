package com.petory.dto.member;

import com.petory.constant.Role;
import lombok.Builder; // ◀◀◀ Builder import
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MemberSearchDto {
  private Long id;
  private String email;
  private String nickname;
  private Role role;
  private String regDate;
}
