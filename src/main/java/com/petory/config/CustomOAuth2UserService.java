package com.petory.config;

import com.petory.entity.Member;
import com.petory.constant.Role;
import com.petory.repository.MemberRepository;
 import lombok.RequiredArgsConstructor;
 import org.springframework.security.core.authority.SimpleGrantedAuthority;
 import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
 import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
 import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
 import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
 import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
 import org.springframework.security.oauth2.core.user.OAuth2User;
 import org.springframework.stereotype.Service;

 import java.util.*;

 @Service
 @RequiredArgsConstructor
 public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

     private final MemberRepository memberRepository;

     @Override
     public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
         OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

         String registrationId = userRequest.getClientRegistration().getRegistrationId(); // google, naver, kakao
         String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                 .getUserInfoEndpoint().getUserNameAttributeName();

         Map<String, Object> attributes = oAuth2User.getAttributes();
         String email = extractEmail(registrationId, attributes);
         String name = extractName(registrationId, attributes);

         // Optional을 사용하여 DB에서 회원을 조회하고, 없으면 새로 생성 및 저장합니다.
         Member member = memberRepository.findByMember_Email(email)
                 .orElseGet(() -> {
                     // orElseGet의 람다 블록은 회원이 DB에 존재하지 않을 때만 실행됩니다.
                     Member newMember = new Member();
                     newMember.setMember_Email(email);
                     newMember.setMember_NickName(name);
                     newMember.setMember_Role(Role.USER);
                     newMember.setMember_Pw("SOCIAL_LOGIN"); // 소셜 로그인이므로 비밀번호는 더미값으로 설정
                     newMember.setMember_Phone("000-0000-0000");
                     newMember.setMember_Mileage(0);
                     return memberRepository.save(newMember); // 새로 생성한 회원을 저장하고 그 객체를 반환
                 });

         return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(member.getMember_Role().toString())),
                 attributes,
                 userNameAttributeName
         );
     }

     public String extractEmail(String provider, Map<String, Object> attributes) {
         if (provider.equals("naver")) {
             Map<String, Object> response = (Map<String, Object>) attributes.get("response");
             return (String) response.get("email");
         } else if (provider.equals("kakao")) {
             Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
             return (String) kakaoAccount.get("email");
         } else {
             return (String) attributes.get("email");
         }
     }

     public String extractName(String provider, Map<String, Object> attributes) {
         if (provider.equals("naver")) {
             Map<String, Object> response = (Map<String, Object>) attributes.get("response");
             return (String) response.get("name");
         } else if (provider.equals("kakao")) {
             Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
             return (String) properties.get("nickname");
         } else {
             return (String) attributes.get("name");
         }
     }
 }
