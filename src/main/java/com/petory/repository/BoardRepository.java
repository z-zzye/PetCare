package com.petory.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.petory.constant.BoardKind;
import com.petory.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

  // 1. 특정 게시판(BoardKind)의 게시글들을 페이징하여 조회 (최신순 정렬은 Pageable 객체에 포함)
  Page<Board> findByBoardKind(BoardKind boardKind, Pageable pageable);

  // 2. 제목에 특정 키워드가 포함된 게시글들을 페이징하여 조회
  // "Containing" 키워드는 SQL의 LIKE '%keyword%'와 동일하게 동작합니다.
  Page<Board> findByTitleContaining(String titleKeyword, Pageable pageable);

  // 3. 내용에 특정 키워드가 포함된 게시글들을 페이징하여 조회
  Page<Board> findByContentContaining(String contentKeyword, Pageable pageable);

  // 4. 특정 회원이 작성한 모든 게시글들을 페이징하여 조회
  // JPQL 쿼리를 직접 사용하여 Member의 member_Id로 Board를 조회
  @Query("SELECT b FROM Board b WHERE b.member.member_Id = :memberId")
  Page<Board> findBoardsByMemberId(@Param("memberId") Long memberId, Pageable pageable);

  // 5. 최근 일주일 인기 게시글 조회 (추천수 기준, 블라인드 처리되지 않은 게시글만)
  @Query("SELECT b FROM Board b " +
         "WHERE b.regDate >= :weekAgo " +
         "AND b.blinded = false " +
         "ORDER BY b.likeCount DESC, b.regDate DESC")
  List<Board> findPopularPostsInLastWeek(
      @Param("weekAgo") LocalDateTime weekAgo, 
      Pageable pageable
  );

}
