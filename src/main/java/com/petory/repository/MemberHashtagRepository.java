package com.petory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.petory.entity.MemberHashtag;
import com.petory.entity.MemberHashtagId;

public interface MemberHashtagRepository extends JpaRepository<MemberHashtag, MemberHashtagId> {
    
    // 사용자 ID로 관심 태그 조회
    @Query("SELECT mh FROM MemberHashtag mh WHERE mh.member.member_Id = :memberId")
    List<MemberHashtag> findByMemberId(@Param("memberId") Long memberId);
    
    // 사용자 엔티티로 관심 태그 조회
    List<MemberHashtag> findByMember(com.petory.entity.Member member);
    
    // 사용자 ID로 모든 관심 태그 삭제
    @Modifying
    @Query("DELETE FROM MemberHashtag mh WHERE mh.member.member_Id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
    
    // 특정 사용자의 특정 태그 존재 여부 확인
    @Query("SELECT COUNT(mh) > 0 FROM MemberHashtag mh WHERE mh.member.member_Id = :memberId AND mh.hashtag.tagId = :tagId")
    boolean existsByMemberIdAndTagId(@Param("memberId") Long memberId, @Param("tagId") Long tagId);
} 