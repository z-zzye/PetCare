package com.petory.repository;

import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Member findByEmail(String email);
    Member findByUserTel(String userTel);
    Member findByNickname(String nickname);
}
