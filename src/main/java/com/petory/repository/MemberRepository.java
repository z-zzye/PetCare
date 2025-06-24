package com.petory.repository;

import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {
    @Query("SELECT m FROM Member m WHERE m.member_Email = :email")
    Member findByMember_Email(@Param("email") String member_Email);

    @Query("SELECT m FROM Member m WHERE m.member_Phone = :phone")
    Member findByMember_Phone(@Param("phone") String member_Phone);

    @Query("SELECT m FROM Member m WHERE m.member_NickName = :nickname")
    Member findByMember_NickName(@Param("nickname") String member_NickName);
}
