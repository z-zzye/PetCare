package com.petory.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.dto.CommentCreateDto;
import com.petory.entity.Board;
import com.petory.entity.CleanBotLog;
import com.petory.entity.Comment;
import com.petory.entity.Member;
import com.petory.repository.BoardRepository;
import com.petory.repository.CleanBotLogRepository;
import com.petory.repository.CommentRepository;
import com.petory.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CommentService {

  private final CommentRepository commentRepository;
  private final MemberRepository memberRepository;
  private final BoardRepository boardRepository;
  private final CleanBotService cleanBotService;
  private final NotificationService notificationService;
  private final CleanBotLogRepository cleanBotLogRepository;

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
    comment.setContent(cleanBotService.filter(requestDto.getContent()));
    comment.setBoard(board); // 연관된 게시글 설정
    comment.setMember(member); // 연관된 작성자 설정

    board.setCommentCount(board.getCommentCount() + 1);

    // 클린봇이 부적절한 내용을 감지한 경우 알림 생성
    if (cleanBotService.containsProfanity(requestDto.getContent())) {
      try {
        notificationService.createCleanBotDetectedNotification(member, requestDto.getContent());
      } catch (Exception e) {
        log.error("클린봇 감지 알림 생성 중 오류 발생: memberId={}", member.getMember_Id(), e);
        // 알림 생성 실패가 댓글 생성을 막지 않도록 예외를 던지지 않음
      }
    }

    Comment savedComment = commentRepository.save(comment);
    
    // 클린봇이 부적절한 내용을 감지한 경우 로그 저장
    if (cleanBotService.containsProfanity(requestDto.getContent())) {
      try {
        CleanBotLog cleanBotLog = new CleanBotLog();
        cleanBotLog.setTargetId(savedComment.getId());
        cleanBotLog.setTargetType("COMMENT");
        cleanBotLog.setOriginalContent(requestDto.getContent());
        cleanBotLogRepository.save(cleanBotLog);
        log.info("클린봇 로그 저장 완료: Comment ID={}", savedComment.getId());
      } catch (Exception e) {
        log.error("클린봇 로그 저장 중 오류 발생: Comment ID={}", savedComment.getId(), e);
        // 로그 저장 실패가 댓글 생성을 막지 않도록 예외를 던지지 않음
      }
    }
    
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

    Board board = comment.getBoard();
    if (board != null) {
      board.setCommentCount(Math.max(0, board.getCommentCount() - 1)); // 음수가 되지 않도록 보장
    }

    commentRepository.delete(comment);
  }
}
