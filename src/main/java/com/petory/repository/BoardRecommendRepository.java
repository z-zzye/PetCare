package com.petory.repository;

import com.petory.entity.Board;
import com.petory.entity.BoardRecommend;
import com.petory.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRecommendRepository extends JpaRepository<BoardRecommend, Long> {
  boolean existsByMemberAndBoard(Member member, Board board);
  // board의 id를 기준으로 관련된 모든 BoardRecommend를 삭제합니다.
  void deleteAllByBoard_Id(Long boardId);
}
