package com.petory.repository;

import com.petory.entity.WalkingTrailComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalkingTrailCommentRepository extends JpaRepository<WalkingTrailComment, Long> {
}
