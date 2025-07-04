package com.petory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class MemberUpdateDto {

  @NotEmpty(message = "이메일은 필수 입력 값입니다.")
  @Email
  private String member_Email;

  @NotBlank(message = "닉네임은 필수 입력 값입니다.")
  private String member_NickName;

  @NotEmpty(message = "연락처는 필수 입력 값입니다.")
  private String member_Phone;

  // 프로필 이미지: 선택 사항
  private MultipartFile member_ProfileImgFile;
}
