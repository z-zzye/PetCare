package com.petory.service;

import com.petory.dto.MemberFormDto;
import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService implements UserDetailsService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    public Member join(MemberFormDto memberFormDto) {
        validateDuplicateMember(memberFormDto); // DTO로 중복 검사

        Member member = Member.createMember(memberFormDto, passwordEncoder); // Entity 생성

        return memberRepository.save(member); // DB 저장
    }

    private void validateDuplicateMember(MemberFormDto memberFormDto) {
        memberRepository.findByMember_Email(memberFormDto.getMember_Email()).ifPresent(m -> {
            throw new IllegalStateException("이미 가입된 이메일입니다.");
        });

        memberRepository.findByMember_Phone(memberFormDto.getMember_Phone()).ifPresent(m -> {
            throw new IllegalStateException("이미 가입된 전화번호입니다.");
        });

        memberRepository.findByMember_NickName(memberFormDto.getMember_NickName()).ifPresent(m -> {
            throw new IllegalStateException("이미 사용중인 닉네임입니다.");
        });
    }

    /**
     * 스프링 시큐리티가 로그인 요청을 가로챌 때, username(여기서는 이메일)으로
     * DB에서 사용자를 찾아와 UserDetails 객체로 변환해주는 메서드
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. 사용자가 입력한 이메일로 DB에서 Member 정보를 조회합니다.
        Member member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> {
                    // DB에 해당 이메일이 없으면, 예외를 발생시킵니다.
                    return new UsernameNotFoundException("해당 사용자를 찾을 수 없습니다: " + email);
                });

        // 2. 찾은 Member 정보를 스프링 시큐리티가 정한 표준 서식(UserDetails)에 맞춰 반환합니다.
        return User.builder()
                .username(member.getMember_Email())      // 사용자의 식별자 (아이디)
                .password(member.getMember_Pw())         // DB에 저장된 "암호화된" 비밀번호
                .roles(member.getMember_Role().toString()) // 사용자의 권한 ("USER", "ADMIN" 등)
                .build();
    }

}
