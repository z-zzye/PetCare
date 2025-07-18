package com.petory.service;

import com.petory.dto.CreatorApplyDto;
import com.petory.dto.CreatorApplyAdminDto;
import com.petory.entity.CreatorApply;
import com.petory.entity.Member;
import com.petory.repository.CreatorApplyRepository;
import com.petory.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
        
        // 1. PENDING 상태 신청 확인
        if (creatorApplyRepository.existsByMemberAndApplyStatus(member, com.petory.constant.ApplyStatus.PENDING)) {
            throw new IllegalStateException("이미 크리에이터 신청이 대기 중입니다.");
        }
        
        // 2. APPROVED 상태 신청 확인  
        if (creatorApplyRepository.existsByMemberAndApplyStatus(member, com.petory.constant.ApplyStatus.APPROVED)) {
            throw new IllegalStateException("이미 크리에이터로 승인되었습니다.");
        }
        
        // 3. REJECTED 상태는 재신청 가능하므로 통과
        
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

    /**
     * 관리자용 크리에이터 신청 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<CreatorApplyAdminDto> getAllCreatorAppliesForAdmin(Pageable pageable) {
        Page<CreatorApply> creatorApplies = creatorApplyRepository.findAllByOrderByRegDateDesc(pageable);
        
        return creatorApplies.map(apply -> CreatorApplyAdminDto.builder()
                .applyId(apply.getApplyId())
                .memberName(apply.getMemberName())
                .memberEmail(apply.getMember().getMember_Email())
                .maincontents(apply.getMaincontents())
                .producingex(apply.getProducingex())
                .creatorInsta(apply.getCreatorInsta())
                .creatorYoutube(apply.getCreatorYoutube())
                .creatorTiktok(apply.getCreatorTiktok())
                .creatorBlog(apply.getCreatorBlog())
                .applyStatus(apply.getApplyStatus())
                .regDate(apply.getRegDate())
                .applyProcessDate(apply.getApplyProcessDate())
                .rejectReason(apply.getRejectReason())
                .build());
    }

    /**
     * 크리에이터 신청 상세 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public CreatorApplyAdminDto getCreatorApplyDetail(Long applyId) {
        CreatorApply apply = creatorApplyRepository.findById(applyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청 내역입니다."));
        
        return CreatorApplyAdminDto.builder()
                .applyId(apply.getApplyId())
                .memberName(apply.getMemberName())
                .memberEmail(apply.getMember().getMember_Email())
                .maincontents(apply.getMaincontents())
                .producingex(apply.getProducingex())
                .creatorInsta(apply.getCreatorInsta())
                .creatorYoutube(apply.getCreatorYoutube())
                .creatorTiktok(apply.getCreatorTiktok())
                .creatorBlog(apply.getCreatorBlog())
                .applyStatus(apply.getApplyStatus())
                .regDate(apply.getRegDate())
                .applyProcessDate(apply.getApplyProcessDate())
                .rejectReason(apply.getRejectReason())
                .build();
    }

    /**
     * 크리에이터 신청 상태 업데이트 (관리자용)
     */
    public void updateApplyStatus(Long applyId, String status) {
        updateApplyStatus(applyId, status, null);
    }

    /**
     * 크리에이터 신청 상태 업데이트 (관리자용) - 거절 사유 포함
     */
    public void updateApplyStatus(Long applyId, String status, String rejectReason) {
        CreatorApply apply = creatorApplyRepository.findById(applyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청 내역입니다."));
        
        com.petory.constant.ApplyStatus applyStatus = com.petory.constant.ApplyStatus.valueOf(status);
        apply.updateStatus(applyStatus);
        
        // 거절 사유 설정
        if (applyStatus == com.petory.constant.ApplyStatus.REJECTED && rejectReason != null) {
            apply.setRejectReason(rejectReason);
        }
        
        // 승인된 경우 멤버의 역할을 CREATOR로 변경
        if (applyStatus == com.petory.constant.ApplyStatus.APPROVED) {
            Member member = apply.getMember();
            member.updateRole(com.petory.constant.Role.CREATOR);
        }
    }
} 