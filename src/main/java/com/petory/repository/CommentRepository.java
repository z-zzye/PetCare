package com.petory.repository;

import com.petory.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

  // 특정 게시글(Board)에 속한 모든 댓글들을 조회합니다.
  // Comment 엔티티(c)의 board 필드의 id 값이 파라미터로 받은 boardId와 일치하는 것을 찾습니다.
  List<Comment> findByBoardIdOrderByRegDateAsc(Long boardId);

  // board의 id를 기준으로 관련된 모든 Comment를 삭제합니다.
  void deleteAllByBoard_Id(Long boardId);
}
