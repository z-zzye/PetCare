package com.petory.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.petory.constant.Role;
import com.petory.dto.ChatMemberDto;
import com.petory.dto.HashtagDto;
import com.petory.dto.PhoneUpdateDto;
import com.petory.dto.member.MemberFormDto;
import com.petory.dto.member.MemberSearchDto;
import com.petory.dto.member.MemberUpdateDto;
import com.petory.entity.Hashtag;
import com.petory.entity.Member;
import com.petory.entity.MemberHashtag;
import com.petory.entity.MemberHashtagId;
import com.petory.repository.HashtagRepository;
import com.petory.repository.MemberHashtagRepository;
import com.petory.repository.MemberRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService implements UserDetailsService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageService imageService;
    private final HashtagRepository hashtagRepository;
    private final MemberHashtagRepository memberHashtagRepository;

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
        member = memberRepository.save(member);
        
        // 5. 해시태그 처리
        if (memberFormDto.getHashtags() != null && memberFormDto.getHashtags().length > 0) {
            saveMemberHashtags(member, memberFormDto.getHashtags());
        }
        
        return member;
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
        Member member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new UsernameNotFoundException("해당 사용자를 찾을 수 없습니다: " + email));
        return new com.petory.config.CustomUserDetails(member);
    }

    /**
     * 이메일로 회원의 전화번호를 업데이트하는 메서드
     */
    public void updatePhoneByEmail(String email, String phone) {
        Member member = getMemberByEmail(email);
        member.setMember_Phone(phone);
    }

    public Member getMemberById(Long member_Id) {
      return memberRepository.findByMember_Id(member_Id).orElse(null);
    }

    public Member getMemberByPhone(String phone) {
      return memberRepository.findByMember_Phone(phone).orElse(null);
    }

    /**
     * 이메일로 비밀번호를 재설정하는 메서드 (JPA save 방식)
     */
    public void resetPassword(String email, String newPassword) {
        Member member = memberRepository.findByMember_Email(email)
            .orElseThrow(() -> new IllegalStateException("해당 이메일의 사용자를 찾을 수 없습니다."));
        System.out.println("비밀번호 변경 대상 이메일: " + email);
        String encodedPw = passwordEncoder.encode(newPassword);
        System.out.println("변경 전 비밀번호: " + member.getMember_Pw());
        member.setMember_Pw(encodedPw);
        memberRepository.save(member);
        System.out.println("변경 후 비밀번호: " + member.getMember_Pw());
    }

  @Transactional
  public void updateMember(MemberUpdateDto dto) {
    Member member = memberRepository.findByMember_Email(dto.getMember_Email())
      .orElseThrow(() -> new IllegalStateException("해당 이메일의 회원을 찾을 수 없습니다."));


    // 닉네임, 전화번호 수정
    member.setMember_NickName(dto.getMember_NickName());
    member.setMember_Phone(dto.getMember_Phone());

    // 프로필 이미지 수정 (선택 사항)
    MultipartFile newProfileImg = dto.getMember_ProfileImgFile();
    if (newProfileImg != null && !newProfileImg.isEmpty()) {
      try {
        String uploadedPath = imageService.uploadFile(newProfileImg, "profile");
        member.setMember_ProfileImg(uploadedPath);
      } catch (Exception e) {
        throw new RuntimeException("프로필 이미지 업로드 중 오류 발생", e);
      }
    }
  }

    // 마일리지는 건드리지 않음 (member_Mileage 유지)
    // JPA의 더티 체킹을 통해 자동 반영 (save 불필요)
  public List<MemberSearchDto> findMembersByRole(Role role) {
    List<Member> members = memberRepository.findAllByMember_Role(role); // 'findAllByMember_Role'은 MemberRepository에 정의된 메서드 이름

    return members.stream()
      .map(member -> MemberSearchDto.builder()
        .id(member.getMember_Id()) // Member 엔티티의 Getter에 맞게 수정
        .email(member.getMember_Email())
        .nickname(member.getMember_NickName())
        .role(member.getMember_Role()) // ◀◀◀ .toString() 제거
        .regDate(member.getRegDate().toString())
        .build())
      .collect(Collectors.toList());
  }

  public ChatMemberDto getChatMemberById(Long memberId) {
    Member member = memberRepository.findById(memberId)
      .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

    return new ChatMemberDto(
      member.getMember_Id(),
      member.getMember_NickName(),
      member.getMember_ProfileImg() // 프로필 이미지 URL 컬럼명 맞게 수정
    );
  }

  /**
   * 회원의 관심 해시태그를 저장하는 메서드
   */
  private void saveMemberHashtags(Member member, String[] hashtagNames) {
    for (String hashtagName : hashtagNames) {
      if (hashtagName != null && !hashtagName.trim().isEmpty()) {
        // 해시태그가 존재하는지 확인하고, 없으면 생성
        Hashtag hashtag = hashtagRepository.findByTagName(hashtagName.trim())
          .orElseGet(() -> {
            Hashtag newHashtag = Hashtag.builder()
              .tagName(hashtagName.trim())
              .tagCount(0)
              .build();
            return hashtagRepository.save(newHashtag);
          });
        
        // MemberHashtag 생성
        MemberHashtagId memberHashtagId = new MemberHashtagId();
        memberHashtagId.setMemberId(member.getMember_Id());
        memberHashtagId.setTagId(hashtag.getTagId());
        
        MemberHashtag memberHashtag = MemberHashtag.builder()
          .id(memberHashtagId)
          .member(member)
          .hashtag(hashtag)
          .build();
        
        memberHashtagRepository.save(memberHashtag);
      }
    }
  }

  /**
   * 회원 ID로 해시태그를 저장하는 메서드 (API용)
   */
  public void saveMemberHashtags(Long memberId, List<String> hashtagNames) {
    Member member = getMemberById(memberId);
    if (member == null) {
      throw new IllegalStateException("존재하지 않는 회원입니다.");
    }
    
    // 기존 해시태그 삭제
    memberHashtagRepository.deleteByMemberId(memberId);
    
    // 새로운 해시태그 저장
    for (String hashtagName : hashtagNames) {
      if (hashtagName != null && !hashtagName.trim().isEmpty()) {
        // 해시태그가 존재하는지 확인하고, 없으면 생성
        Hashtag hashtag = hashtagRepository.findByTagName(hashtagName.trim())
          .orElseGet(() -> {
            Hashtag newHashtag = Hashtag.builder()
              .tagName(hashtagName.trim())
              .tagCount(0)
              .build();
            return hashtagRepository.save(newHashtag);
          });
        
        // MemberHashtag 생성
        MemberHashtagId memberHashtagId = new MemberHashtagId();
        memberHashtagId.setMemberId(memberId);
        memberHashtagId.setTagId(hashtag.getTagId());
        
        MemberHashtag memberHashtag = MemberHashtag.builder()
          .id(memberHashtagId)
          .member(member)
          .hashtag(hashtag)
          .build();
        
        memberHashtagRepository.save(memberHashtag);
      }
    }
  }

  /**
   * 회원 ID로 해시태그를 조회하는 메서드 (API용)
   */
  public List<HashtagDto> getMemberHashtags(Long memberId) {
    Member member = getMemberById(memberId);
    if (member == null) {
      throw new IllegalStateException("존재하지 않는 회원입니다.");
    }
    
    List<MemberHashtag> memberHashtags = memberHashtagRepository.findByMemberId(memberId);
    return memberHashtags.stream()
      .map(memberHashtag -> HashtagDto.fromEntity(memberHashtag.getHashtag()))
      .collect(Collectors.toList());
  }

  /**
   * 회원 ID로 역할을 조회하는 메서드 (API용)
   */
  public String getMemberRole(Long memberId) {
    Member member = getMemberById(memberId);
    if (member == null) {
      throw new IllegalStateException("존재하지 않는 회원입니다.");
    }
    
    return member.getMember_Role().name();
  }

  public void updateAddress(Member member, double lat, double lng) {
    if (member == null) {
        throw new IllegalStateException("로그인 정보가 올바르지 않습니다. 다시 로그인 해주세요.");
    }
    String addressString = lat + "," + lng;
    member.setMember_Address(addressString);
    memberRepository.save(member);
}
}
