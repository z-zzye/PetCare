package com.petory.service;

import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final FileService fileService;

    public Member saveMember(Member member) {
        validateDuplicateMember(member);
        return memberRepository.save(member); // 데이터베이스에 저장을 하라는 명령
    }

    private void validateDuplicateMember(Member member) {
        Member findMember = memberRepository.findByEmail(member.getMember_Email());
        if (findMember != null) {
            throw new IllegalStateException("이미 가입된 회원입니다."); // 예외 발생
        }

        findMember = memberRepository.findByPhone(member.getMember_Phone());
        if (findMember != null) {
            throw new IllegalStateException("이미 가입된 전화번호입니다."); // 예외 발생
        }

        findMember = memberRepository.findByNickName(member.getMember_NickName());
        if (findMember != null) {
            throw new IllegalStateException("이미 사용중인 닉네임입니다."); // 예외 발생
        }
    }

}
