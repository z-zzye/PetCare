package com.petory.repository;

import com.petory.entity.WalkingTrail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalkingTrailRepository extends JpaRepository<WalkingTrail, Long> {
}
