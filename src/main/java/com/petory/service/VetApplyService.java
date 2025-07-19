package com.petory.service;

import com.petory.dto.VetApplyDto;
import com.petory.dto.VetApplyAdminDto;
import com.petory.entity.VetApply;
import com.petory.entity.Member;
import com.petory.repository.VetApplyRepository;
import com.petory.repository.MemberRepository;
import com.petory.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class VetApplyService {
    
    private final VetApplyRepository vetApplyRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    
    /**
     * 수의사 신청
     */
    public VetApply applyForVet(VetApplyDto vetApplyDto, String memberEmail) {
        // 멤버 조회
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        // 1. PENDING 상태 신청 확인
        if (vetApplyRepository.existsByMemberAndApplyStatus(member, com.petory.constant.ApplyStatus.PENDING)) {
            throw new IllegalStateException("이미 수의사 신청이 대기 중입니다.");
        }
        
        // 2. APPROVED 상태 신청 확인  
        if (vetApplyRepository.existsByMemberAndApplyStatus(member, com.petory.constant.ApplyStatus.APPROVED)) {
            throw new IllegalStateException("이미 수의사로 승인되었습니다.");
        }
        
        // 3. REJECTED 상태는 재신청 가능하므로 통과
        
        // VetApply 엔티티 생성
        VetApply vetApply = VetApply.createVetApply(
                member,
                vetApplyDto.getName(),
                vetApplyDto.getLicenseNumber(),
                vetApplyDto.getHospitalName(),
                vetApplyDto.getHospitalAddress(),
                vetApplyDto.getHospitalPhone(),
                vetApplyDto.getSpecialization(),
                vetApplyDto.getExperienceYears(),
                vetApplyDto.getCertifications()
        );
        
        return vetApplyRepository.save(vetApply);
    }
    
    /**
     * 특정 멤버의 수의사 신청 내역 조회
     */
    @Transactional(readOnly = true)
    public List<VetApply> getVetAppliesByMember(String memberEmail) {
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        return vetApplyRepository.findByMemberOrderByRegDateDesc(member);
    }
    
    /**
     * 특정 멤버의 최신 수의사 신청 조회
     */
    @Transactional(readOnly = true)
    public Optional<VetApply> getLatestVetApplyByMember(String memberEmail) {
        Member member = memberRepository.findByMember_Email(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        return vetApplyRepository.findFirstByMemberOrderByRegDateDesc(member);
    }
    
    /**
     * 모든 수의사 신청 내역 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<VetApply> getAllVetApplies() {
        return vetApplyRepository.findAll();
    }
    
    /**
     * 특정 상태의 수의사 신청 내역 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<VetApply> getVetAppliesByStatus(com.petory.constant.ApplyStatus status) {
        return vetApplyRepository.findByApplyStatusOrderByRegDateDesc(status);
    }

    /**
     * 관리자용 수의사 신청 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<VetApplyAdminDto> getAllVetAppliesForAdmin(Pageable pageable) {
        Page<VetApply> vetApplies = vetApplyRepository.findAllByOrderByRegDateDesc(pageable);
        
        return vetApplies.map(apply -> VetApplyAdminDto.builder()
                .applyId(apply.getApplyId())
                .memberName(apply.getMemberName())
                .memberEmail(apply.getMember().getMember_Email())
                .licenseNumber(apply.getLicenseNumber())
                .hospitalName(apply.getHospitalName())
                .hospitalAddress(apply.getHospitalAddress())
                .hospitalPhone(apply.getHospitalPhone())
                .specialization(apply.getSpecialization())
                .experienceYears(apply.getExperienceYears())
                .certifications(apply.getCertifications())
                .applyStatus(apply.getApplyStatus())
                .regDate(apply.getRegDate())
                .applyProcessDate(apply.getApplyProcessDate())
                .rejectReason(apply.getRejectReason())
                .build());
    }

    /**
     * 수의사 신청 상세 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public VetApplyAdminDto getVetApplyDetail(Long applyId) {
        VetApply apply = vetApplyRepository.findById(applyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청 내역입니다."));
        
        return VetApplyAdminDto.builder()
                .applyId(apply.getApplyId())
                .memberName(apply.getMemberName())
                .memberEmail(apply.getMember().getMember_Email())
                .licenseNumber(apply.getLicenseNumber())
                .hospitalName(apply.getHospitalName())
                .hospitalAddress(apply.getHospitalAddress())
                .hospitalPhone(apply.getHospitalPhone())
                .specialization(apply.getSpecialization())
                .experienceYears(apply.getExperienceYears())
                .certifications(apply.getCertifications())
                .applyStatus(apply.getApplyStatus())
                .regDate(apply.getRegDate())
                .applyProcessDate(apply.getApplyProcessDate())
                .rejectReason(apply.getRejectReason())
                .build();
    }

    /**
     * 수의사 신청 상태 업데이트 (관리자용)
     */
    public void updateApplyStatus(Long applyId, String status) {
        updateApplyStatus(applyId, status, null);
    }

    /**
     * 수의사 신청 상태 업데이트 (관리자용) - 거절 사유 포함
     */
    public void updateApplyStatus(Long applyId, String status, String rejectReason) {
        VetApply apply = vetApplyRepository.findById(applyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청 내역입니다."));
        
        com.petory.constant.ApplyStatus applyStatus = com.petory.constant.ApplyStatus.valueOf(status);
        apply.updateStatus(applyStatus);
        
        // 거절 사유 설정
        if (applyStatus == com.petory.constant.ApplyStatus.REJECTED && rejectReason != null) {
            apply.setRejectReason(rejectReason);
        }
        
        // 승인된 경우 멤버의 역할을 VET으로 변경
        if (applyStatus == com.petory.constant.ApplyStatus.APPROVED) {
            Member member = apply.getMember();
            member.updateRole(com.petory.constant.Role.VET);
            // Member 엔티티 변경 후 저장
            memberRepository.save(member);
            
            // 수의사 승인 알림 생성 (별도 트랜잭션으로 처리)
            createApprovalNotification(member);
        }
        
        // 거절된 경우 수의사 거절 알림 생성 (별도 트랜잭션으로 처리)
        if (applyStatus == com.petory.constant.ApplyStatus.REJECTED) {
            Member member = apply.getMember();
            createRejectionNotification(member, rejectReason);
        }
    }
    
    /**
     * 수의사 승인 알림 생성 (별도 메서드로 분리)
     */
    private void createApprovalNotification(Member member) {
        try {
            notificationService.createVetApprovedNotification(member);
            log.info("수의사 승인 알림 생성 완료: memberId={}", member.getMember_Id());
        } catch (Exception e) {
            log.error("수의사 승인 알림 생성 중 오류 발생: memberId={}", member.getMember_Id(), e);
            // 알림 생성 실패가 승인 처리를 막지 않도록 예외를 던지지 않음
        }
    }
    
    /**
     * 수의사 거절 알림 생성 (별도 메서드로 분리)
     */
    private void createRejectionNotification(Member member, String rejectReason) {
        try {
            notificationService.createVetRejectedNotification(member, rejectReason);
            log.info("수의사 거절 알림 생성 완료: memberId={}, rejectReason={}", member.getMember_Id(), rejectReason);
        } catch (Exception e) {
            log.error("수의사 거절 알림 생성 중 오류 발생: memberId={}", member.getMember_Id(), e);
            // 알림 생성 실패가 거절 처리를 막지 않도록 예외를 던지지 않음
        }
    }
} 