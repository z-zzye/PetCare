package com.petory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatMemberDto {
  private Long memberId;
  private String nickName;
  private String profileImg;
}
