package com.petory.entity;

import com.petory.constant.Role;
import com.petory.dto.MemberFormDto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.crypto.password.PasswordEncoder;

@Entity
@Getter
@Setter
@ToString
public class Member extends BaseEntity {
    @Id
    @Column(name = "user_Id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_Pw", nullable = false)
    private String password;

    @Column(name = "user_Email", nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_Role", nullable = false)
    private Role role;

    @Column(name = "user_NickName", nullable = false)
    private String nickname;

    @Column(name = "user_tel")
    private String userTel;

    @Column(name = "user_ProfileImg")
    private String profileImg;

    @Column(name = "user_milleage")
    private Integer milleage;

    private String address;


    public static Member createMember(MemberFormDto memberFormDto,
                                      PasswordEncoder passwordEncoder) {
        Member member = new Member();
        member.setNickname(memberFormDto.getNickname());
        member.setEmail(memberFormDto.getEmail());
        member.setAddress(memberFormDto.getAddress());
        member.setUserTel(memberFormDto.getUserTel());
        String password = passwordEncoder.encode(memberFormDto.getPassword());
        member.setPassword(password);
        member.setRole(Role.USER);
        member.setMilleage(0);
        return member;
    }
}
