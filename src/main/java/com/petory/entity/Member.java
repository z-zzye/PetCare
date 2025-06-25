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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_Id")
    private Long member_Id;

    @Column(name = "member_Pw", nullable = false)
    private String member_Pw;

    @Column(name = "member_Email", nullable = false, unique = true)
    private String member_Email;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_Role", nullable = false)
    private Role member_Role;

    @Column(name = "member_NickName", nullable = false)
    private String member_NickName;

    @Column(name = "member_Phone", nullable = false)
    private String member_Phone;

    @Column(name = "member_ProfileImg", length = 500)
    private String member_ProfileImg;

    @Column(name = "member_Mileage")
    private Integer member_Mileage;

    private String address;


    public static Member createMember(MemberFormDto memberFormDto,
                                      PasswordEncoder passwordEncoder,
                                      String profileImageName) {
        Member member = new Member();
        member.setMember_NickName(memberFormDto.getMember_NickName());
        member.setMember_Email(memberFormDto.getMember_Email());
        member.setMember_Pw(passwordEncoder.encode(memberFormDto.getMember_Pw()));
        member.setMember_Phone(memberFormDto.getMember_Phone());
        member.setMember_Role(Role.USER);
        member.setMember_Mileage(0);
        member.setMember_ProfileImg(profileImageName);
        return member;
    }
}
