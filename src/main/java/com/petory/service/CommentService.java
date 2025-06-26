package com.petory.service;

import com.petory.dto.CommentCreateDto;
import com.petory.entity.Board;
import com.petory.entity.Comment;
import com.petory.entity.Member;
import com.petory.repository.BoardRepository;
import com.petory.repository.CommentRepository;
import com.petory.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentService {

  private final CommentRepository commentRepository;
  private final MemberRepository memberRepository;
  private final BoardRepository boardRepository;

  /**
   * 새 댓글 생성
   */
  public Long createComment(Long boardId, CommentCreateDto requestDto, String email) {
    // 댓글을 작성할 회원과 게시글을 DB에서 조회합니다.
    Member member = memberRepository.findByMember_Email(email)
      .orElseThrow(() -> new IllegalArgumentException("해당 회원을 찾을 수 없습니다."));
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    // 새 Comment 엔티티를 생성하고 정보를 설정합니다.
    Comment comment = new Comment();
    comment.setContent(requestDto.getContent());
    comment.setBoard(board); // 연관된 게시글 설정
    comment.setMember(member); // 연관된 작성자 설정

    Comment savedComment = commentRepository.save(comment);
    return savedComment.getId();
  }

  /**
   * 댓글 삭제
   */
  public void deleteComment(Long commentId, String email) {
    // 삭제할 댓글을 DB에서 조회합니다.
    Comment comment = commentRepository.findById(commentId)
      .orElseThrow(() -> new IllegalArgumentException("해당 댓글을 찾을 수 없습니다."));

    // 현재 로그인한 사용자가 댓글 작성자인지 확인합니다.
    if (!comment.getMember().getMember_Email().equals(email)) {
      throw new IllegalStateException("댓글을 삭제할 권한이 없습니다.");
    }

    commentRepository.delete(comment);
  }
}
