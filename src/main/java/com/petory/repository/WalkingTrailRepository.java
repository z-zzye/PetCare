package com.petory.repository;

import com.petory.entity.WalkingTrail;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalkingTrailRepository extends JpaRepository<WalkingTrail, Long> {
  // 이름에 특정 키워드가 포함된 산책로를 검색하는 메서드
  List<WalkingTrail> findByNameContaining(String keyword, Sort sort);
}
