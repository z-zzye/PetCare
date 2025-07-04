package com.petory.dto;

import com.petory.entity.Member;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MemberDto {
  private String member_Email;
  private String member_NickName;
  private String member_Phone;
  private String member_ProfileImg;

  public static MemberDto from(Member member) {
    MemberDto dto = new MemberDto();
    dto.setMember_Email(member.getMember_Email());
    dto.setMember_NickName(member.getMember_NickName());
    dto.setMember_Phone(member.getMember_Phone());
    dto.setMember_ProfileImg(member.getMember_ProfileImg());
    return dto;
  }
}
