package com.petory.repository;

import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Member findByMember_Email(String member_Email);
    Member findByMember_Phone(String member_Phone);
    Member findByMember_NickName(String member_NickName);
}
