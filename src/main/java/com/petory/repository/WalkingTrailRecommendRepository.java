package com.petory.repository;

import com.petory.entity.WalkingTrail;
import com.petory.entity.WalkingTrailRecommend;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalkingTrailRecommendRepository extends JpaRepository<WalkingTrailRecommend, Long> {
    boolean existsByWalkingTrailAndMember(WalkingTrail trail, Member member);
} 