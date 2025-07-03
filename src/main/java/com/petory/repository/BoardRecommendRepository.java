package com.petory.repository;

import com.petory.entity.Board;
import com.petory.entity.BoardRecommend;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRecommendRepository extends JpaRepository<BoardRecommend, Long> {
  boolean existsByMemberAndBoard(Member member, Board board);
}
