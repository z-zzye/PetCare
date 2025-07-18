package com.petory.service;

import com.petory.dto.CreatorApplyDto;
import com.petory.entity.CreatorApply;
import com.petory.entity.Member;
import com.petory.repository.CreatorApplyRepository;
import com.petory.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CreatorApplyService {
    
    private final CreatorApplyRepository creatorApplyRepository;
    private final MemberRepository memberRepository;
    
    /**
     * 크리에이터 신청
     */
    public CreatorApply applyForCreator(CreatorApplyDto creatorApplyDto, String memberEmail) {
        // 멤버 조회
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        // 이미 신청한 내역이 있는지 확인
        if (creatorApplyRepository.existsByMember(member)) {
            throw new IllegalStateException("이미 크리에이터 신청을 완료했습니다.");
        }
        
        // CreatorApply 엔티티 생성
        CreatorApply creatorApply = CreatorApply.createCreatorApply(
                member,
                creatorApplyDto.getName(),
                creatorApplyDto.getContent(),
                creatorApplyDto.getExperience(),
                creatorApplyDto.getInstagram(),
                creatorApplyDto.getYoutube(),
                creatorApplyDto.getTiktok(),
                creatorApplyDto.getBlog()
        );
        
        return creatorApplyRepository.save(creatorApply);
    }
    
    /**
     * 특정 멤버의 크리에이터 신청 내역 조회
     */
    @Transactional(readOnly = true)
    public List<CreatorApply> getCreatorAppliesByMember(String memberEmail) {
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        return creatorApplyRepository.findByMemberOrderByRegDateDesc(member);
    }
    
    /**
     * 특정 멤버의 최신 크리에이터 신청 조회
     */
    @Transactional(readOnly = true)
    public Optional<CreatorApply> getLatestCreatorApplyByMember(String memberEmail) {
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        return creatorApplyRepository.findFirstByMemberOrderByRegDateDesc(member);
    }
    
    /**
     * 모든 크리에이터 신청 내역 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<CreatorApply> getAllCreatorApplies() {
        return creatorApplyRepository.findAll();
    }
    
    /**
     * 특정 상태의 크리에이터 신청 내역 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<CreatorApply> getCreatorAppliesByStatus(com.petory.constant.ApplyStatus status) {
        return creatorApplyRepository.findByApplyStatusOrderByRegDateDesc(status);
    }
} 