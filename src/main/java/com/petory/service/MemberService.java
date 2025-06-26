package com.petory.service;

import com.petory.dto.MemberFormDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import java.io.IOException;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService implements UserDetailsService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageService imageService;

    public Member join(MemberFormDto memberFormDto) {
        validateDuplicateMember(memberFormDto); // 1. 중복 회원 검사

        String savedProfileImgPath = null; // DB에 저장될 이미지 경로를 담을 변수

        try {
            // 2. ImageService를 사용하여 파일 업로드
            // 첫 번째 인자는 MultipartFile 객체, 두 번째 인자는 저장할 위치 타입("profile")입니다.
            savedProfileImgPath = imageService.uploadFile(memberFormDto.getMember_ProfileImgFile(), "profile");

        } catch (Exception e) {
            // 이미지 업로드 중 에러가 발생하면 런타임 예외를 발생시켜 트랜잭션을 롤백합니다.
            // 실제 운영 코드에서는 로깅을 추가하는 것이 좋습니다.
            throw new RuntimeException("프로필 이미지 업로드 중 오류가 발생했습니다.", e);
        }

        // 3. Member 엔티티 생성 시, 저장된 이미지 경로를 함께 전달
        Member member = Member.createMember(memberFormDto, passwordEncoder, savedProfileImgPath);

        // 4. DB에 최종 저장
        return memberRepository.save(member);
    }

    /**
     * 이메일로 회원을 조회하는 메서드
     */
    public Member getMemberByEmail(String email) {
        return memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new IllegalStateException("로그인한 사용자를 찾을 수 없습니다."));
    }

    /**
     * 현재 로그인한 사용자의 전화번호를 업데이트하는 메서드
     */
    public void updatePhone(PhoneUpdateDto phoneUpdateDto) {
        // 현재 로그인한 사용자의 이메일을 가져옵니다
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // 이메일로 회원을 찾습니다
        Member member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new IllegalStateException("로그인한 사용자를 찾을 수 없습니다."));

        // 전화번호 중복 검사 (자신의 전화번호는 제외)
        memberRepository.findByMember_Phone(phoneUpdateDto.getPhone())
                .ifPresent(m -> {
                    if (!m.getMember_Id().equals(member.getMember_Id())) {
                        throw new IllegalStateException("이미 사용 중인 전화번호입니다.");
                    }
                });

        // 전화번호를 업데이트합니다
        member.setMember_Phone(phoneUpdateDto.getPhone());
    }

    /**
     * 현재 로그인한 사용자가 소셜 로그인 사용자인지 확인하는 메서드
     */
    public boolean isSocialLoginUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Member member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new IllegalStateException("로그인한 사용자를 찾을 수 없습니다."));

        // 소셜 로그인 사용자는 비밀번호가 "SOCIAL_LOGIN"으로 설정되어 있습니다
        return "SOCIAL_LOGIN".equals(member.getMember_Pw());
    }

    /**
     * 현재 로그인한 사용자의 전화번호가 기본값인지 확인하는 메서드
     */
    public boolean hasDefaultPhone() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Member member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new IllegalStateException("로그인한 사용자를 찾을 수 없습니다."));

        return "000-0000-0000".equals(member.getMember_Phone());
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

    /**
     * 이메일로 회원의 전화번호를 업데이트하는 메서드
     */
    public void updatePhoneByEmail(String email, String phone) {
        Member member = getMemberByEmail(email);
        member.setMember_Phone(phone);
    }

    public Member getMemberByPhone(String phone) {
      return memberRepository.findByMember_Phone(phone).orElse(null);
    }
}
