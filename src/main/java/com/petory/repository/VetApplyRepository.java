package com.petory.repository;

import com.petory.entity.VetApply;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VetApplyRepository extends JpaRepository<VetApply, Long> {
    
    // 특정 멤버의 수의사 신청 내역 조회
    List<VetApply> findByMemberOrderByRegDateDesc(Member member);
    
    // 특정 멤버의 최신 수의사 신청 조회
    Optional<VetApply> findFirstByMemberOrderByRegDateDesc(Member member);
    
    // 특정 상태의 신청 목록 조회
    List<VetApply> findByApplyStatusOrderByRegDateDesc(com.petory.constant.ApplyStatus status);
    
    // 멤버 ID로 수의사 신청 존재 여부 확인
    boolean existsByMember(Member member);
    
    // 특정 멤버의 특정 상태 신청 존재 여부 확인
    boolean existsByMemberAndApplyStatus(Member member, com.petory.constant.ApplyStatus status);
    
    // 특정 멤버의 특정 상태들 중 하나라도 존재하는지 확인
    boolean existsByMemberAndApplyStatusIn(Member member, java.util.List<com.petory.constant.ApplyStatus> statuses);
    
    // 관리자용 페이징 조회
    org.springframework.data.domain.Page<VetApply> findAllByOrderByRegDateDesc(org.springframework.data.domain.Pageable pageable);
} 