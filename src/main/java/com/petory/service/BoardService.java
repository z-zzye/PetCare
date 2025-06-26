package com.petory.service;

import com.petory.dto.*;
import com.petory.entity.Board;
import com.petory.entity.Comment;
import com.petory.entity.Member;
import com.petory.repository.BoardRepository;
import com.petory.repository.CommentRepository;
import com.petory.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardService {

  private final BoardRepository boardRepository;
  private final MemberRepository memberRepository;
  private final CommentRepository commentRepository;

  /**
   * 새 게시글 생성
   */
  public Long createBoard(BoardCreateDto requestDto, String email) {
    Member member = memberRepository.findByMember_Email(email)
      .orElseThrow(() -> new IllegalArgumentException("해당 회원을 찾을 수 없습니다."));

    Board board = new Board();
    board.setTitle(requestDto.getTitle());
    board.setContent(requestDto.getContent());
    board.setBoardKind(requestDto.getBoardKind());
    board.setHashTag(requestDto.getHashTag());
    board.setMember(member);

    Board savedBoard = boardRepository.save(board);
    return savedBoard.getId();
  }

  /**
   * 게시글 목록 조회 (페이징 처리)
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> getBoardList(Pageable pageable) {
    // Board 엔티티 페이지를 BoardListResponseDto 페이지로 변환하여 반환
    return boardRepository.findAll(pageable).map(BoardListDto::from);
  }

  /**
   * 게시글 상세 조회
   */
  @Transactional(readOnly = true)
  public BoardDetailDto getBoardDetail(Long boardId) {
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    // 해당 게시글의 댓글 목록도 함께 조회
    List<Comment> comments = commentRepository.findByBoardIdOrderByRegDateAsc(boardId);

    return BoardDetailDto.from(board, comments);
  }

  /**
   * 게시글 수정
   */
  public void updateBoard(Long boardId, BoardUpdateDto requestDto, String email) {
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    // 작성자 본인 확인
    if (!board.getMember().getMember_Email().equals(email)) {
      throw new IllegalStateException("게시글을 수정할 권한이 없습니다.");
    }

    // DTO에 내용이 있을 경우에만 필드 업데이트
    if (requestDto.getTitle() != null) board.setTitle(requestDto.getTitle());
    if (requestDto.getContent() != null) board.setContent(requestDto.getContent());
    if (requestDto.getBoardKind() != null) board.setBoardKind(requestDto.getBoardKind());
    if (requestDto.getHashTag() != null) board.setHashTag(requestDto.getHashTag());

    // @Transactional 어노테이션에 의해 메서드 종료 시 자동으로 DB에 반영됨
  }

  /**
   * 게시글 삭제
   */
  public void deleteBoard(Long boardId, String email) {
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    if (!board.getMember().getMember_Email().equals(email)) {
      throw new IllegalStateException("게시글을 삭제할 권한이 없습니다.");
    }
    boardRepository.delete(board);
  }
}
