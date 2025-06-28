package com.petory.config;

import com.petory.entity.Member;
import com.petory.constant.Role;
import com.petory.repository.MemberRepository;
import com.petory.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpSession;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberRepository memberRepository;
    private final ImageService imageService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = extractEmail(registrationId, attributes);
        String name = extractName(registrationId, attributes);
        // 1. 소셜 서비스로부터 원본 프로필 이미지 URL을 가져옵니다.
        String originalProfileImageUrl = extractProfileImage(registrationId, attributes);

        // 기존 회원인지 확인
        Optional<Member> existingMember = memberRepository.findByMember_Email(email);

        if (existingMember.isPresent()) {
            // 기존 회원인 경우 바로 로그인 처리
            Member member = existingMember.get();
            return new DefaultOAuth2User(
                    Collections.singleton(new SimpleGrantedAuthority(member.getMember_Role().toString())),
                    attributes,
                    userNameAttributeName
            );
        } else {
            // 새 회원인 경우 회원가입 처리 후 전화번호 입력 페이지로 리다이렉트
            Member newMember = new Member();
            // 2. ImageService를 사용해 이미지를 우리 서버에 다운로드하고, 저장된 경로를 받아옵니다.
            String savedProfileImgPath = imageService.downloadAndSaveImage(originalProfileImageUrl, "profile");
          System.out.println("카카오 로그인 attributes: " + attributes);
            // 3. Member 객체에 '저장된 경로'를 설정합니다.
            newMember.setMember_ProfileImg(savedProfileImgPath);
            newMember.setMember_Email(email);
            newMember.setMember_NickName(name);
            newMember.setMember_Role(Role.USER);
            newMember.setMember_Pw("SOCIAL_LOGIN"); // 소셜 로그인이므로 비밀번호는 더미값으로 설정
            newMember.setMember_Phone("000-0000-0000");
            newMember.setMember_Mileage(0);

            memberRepository.save(newMember);

            // 세션에 전화번호 입력 필요 플래그 설정
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null) {
                HttpSession session = requestAttributes.getRequest().getSession();
                session.setAttribute("NEED_PHONE_INPUT", true);
            }

            // 임시 OAuth2User 반환 (실제로는 인증 성공 핸들러에서 처리됨)
            return new DefaultOAuth2User(
                    Collections.singleton(new SimpleGrantedAuthority(Role.USER.toString())),
                    attributes,
                    userNameAttributeName
            );
        }
    }

    public String extractProvider(Map<String, Object> attributes) {
        if (attributes.containsKey("response")) return "naver";
        if (attributes.containsKey("kakao_account")) return "kakao";
        return "google";
    }

    public String extractEmail(String provider, Map<String, Object> attributes) {
        if ("naver".equals(provider)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            return (String) response.get("email");
        }
        if ("kakao".equals(provider)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            return (String) kakaoAccount.get("email");
        }
        // 기본: 구글 등 기타
        return (String) attributes.get("email");
    }

    public String extractName(String provider, Map<String, Object> attributes) {
        if ("naver".equals(provider)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            return (String) response.get("name");
        }
        if ("kakao".equals(provider)) {
            Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
            return (String) properties.get("nickname");
        }
        // 기본: 구글 등 기타
        return (String) attributes.get("name");
    }

    public String extractProfileImage(String provider, Map<String, Object> attributes) {
        if ("naver".equals(provider)) {
            Map<String, Object> naverResponse = (Map<String, Object>) attributes.get("response");
            return (String) naverResponse.get("profile_image");
        }
        if ("kakao".equals(provider)) {
            Map<String, Object> kakaoProperties = (Map<String, Object>) attributes.get("properties");
            return (String) kakaoProperties.get("profile_image");
        }
        // 기본: 구글 등 기타
        return (String) attributes.get("picture");
    }
}
