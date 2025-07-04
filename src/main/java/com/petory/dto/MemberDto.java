package com.petory.dto;

import java.time.LocalDateTime;

import com.petory.constant.Role;
import com.petory.entity.Member;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MemberDto {
    private Long id;
    private String email;
    private String nickname;
    private Role role;
    private String regDate;
}
