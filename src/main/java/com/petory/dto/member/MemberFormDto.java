package com.petory.dto.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class MemberFormDto {
    @NotBlank(message = "닉네임은 필수 입력 값입니다.")
    private String member_NickName;

    @NotEmpty(message = "이메일은 필수 입력 값입니다.")
    @Email
    private String member_Email;

    @NotEmpty(message = "비밀번호는 필수 입력 값입니다.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,16}$",
        message = "비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 혼합하여 8~16자 사이로 입력해주세요."
    )
    @Length(min = 8, max = 16, message = "비밀번호는 8자 이상, 16자 이하로 입력해주세요.")
    private String member_Pw;

    @NotEmpty(message = "연락처는 필수 입력 값입니다.")
    private String member_Phone;

    // 프로필 이미지는 파일 업로드용 (선택사항)
    private MultipartFile member_ProfileImgFile;

    // 마일리지는 선택사항이므로 null 허용
    private Integer member_Mileage;
    
    // 관심 해시태그 리스트 (선택사항)
    private String[] hashtags;
}
