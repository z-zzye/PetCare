package com.petory.repository;

import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 반환 타입을 Member에서 Optional<Member>로 수정
    @Query("SELECT m FROM Member m WHERE m.member_Email = :email")
    Optional<Member> findByMember_Email(@Param("email") String member_Email);

    // 반환 타입을 Member에서 Optional<Member>로 수정
    @Query("SELECT m FROM Member m WHERE m.member_Phone = :phone")
    Optional<Member> findByMember_Phone(@Param("phone") String member_Phone);

    // 반환 타입을 Member에서 Optional<Member>로 수정
    @Query("SELECT m FROM Member m WHERE m.member_NickName = :nickname")
    Optional<Member> findByMember_NickName(@Param("nickname") String member_NickName);
}
