package com.petory.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.constant.BoardKind;
import com.petory.dto.BoardCreateDto;
import com.petory.dto.BoardDetailDto;
import com.petory.dto.BoardListDto;
import com.petory.dto.BoardUpdateDto;
import com.petory.entity.Board;
import com.petory.entity.BoardRecommend;
import com.petory.entity.Comment;
import com.petory.entity.Member;
import com.petory.repository.BoardRecommendRepository;
import com.petory.repository.BoardRepository;
import com.petory.repository.CommentRepository;
import com.petory.repository.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardService {

  private final BoardRepository boardRepository;
  private final MemberRepository memberRepository;
  private final CommentRepository commentRepository;
  private final CleanBotService cleanBotService;
  private final HttpServletRequest httpServletRequest;
  private final BoardRecommendRepository boardRecommendRepository;

  /**
   * 새 게시글 생성
   */
  public Long createBoard(BoardCreateDto requestDto, String email) {
    Member member = memberRepository.findByMember_Email(email)
      .orElseThrow(() -> new IllegalArgumentException("해당 회원을 찾을 수 없습니다."));

    Board board = new Board();
    
    // 클린봇 필터링 적용
    String filteredTitle = cleanBotService.filter(requestDto.getTitle());
    String filteredContent = cleanBotService.filter(requestDto.getContent());
    
    board.setTitle(filteredTitle);
    board.setContent(filteredContent);
    board.setBoardKind(requestDto.getBoardKind());
    board.setHashTag(requestDto.getHashTag());
    board.setMember(member);

    // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
    if (cleanBotService.containsProfanity(requestDto.getTitle()) || 
        cleanBotService.containsProfanity(requestDto.getContent())) {
      board.setOriginalTitle(requestDto.getTitle());
      board.setOriginalContent(requestDto.getContent());
      board.setBlinded(true);
    }

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
   * 게시글 목록 조회 (카테고리별 페이징 처리)
   */
  @Transactional(readOnly = true)
  // ▼▼▼ String category 파라미터 추가 ▼▼▼
  public Page<BoardListDto> getBoardList(String category, Pageable pageable) {
    // 1. 문자열로 받은 category를 BoardKind Enum으로 변환
    BoardKind boardKind = BoardKind.valueOf(category.toUpperCase());

    // 2. Repository에 미리 정의해둔 findByBoardKind 메서드를 사용
    return boardRepository.findByBoardKind(boardKind, pageable)
      .map(BoardListDto::from);
  }

  /**
   * 게시글 상세 조회
   */
  @Transactional
  public BoardDetailDto getBoardDetail(Long boardId) {
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    HttpSession session = httpServletRequest.getSession();
    String sessionKey = "viewed_board_" + boardId;

    /* 현재로서는 리액트 개발 환경의 엄격 모드(StrictMode) 때문에 조회수가 2씩 증가
    * 추후 배포단계로 넘어갈 시 자연스럽게 해결될 예정*/
    if (httpServletRequest.getAttribute(sessionKey) == null) {
      board.setViewCount(board.getViewCount() + 1);
      session.setAttribute(sessionKey, true);
    }

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
    if (requestDto.getTitle() != null) {
      String filteredTitle = cleanBotService.filter(requestDto.getTitle());
      board.setTitle(filteredTitle);
      
      // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
      if (cleanBotService.containsProfanity(requestDto.getTitle())) {
        board.setOriginalTitle(requestDto.getTitle());
        board.setBlinded(true);
      }
    }
    
    if (requestDto.getContent() != null) {
      String filteredContent = cleanBotService.filter(requestDto.getContent());
      board.setContent(filteredContent);
      
      // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
      if (cleanBotService.containsProfanity(requestDto.getContent())) {
        board.setOriginalContent(requestDto.getContent());
        board.setBlinded(true);
      }
    }
    
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
    boardRecommendRepository.deleteAllByBoard_Id(boardId); // 추천 기록 먼저 삭제
    commentRepository.deleteAllByBoard_Id(boardId);
    boardRepository.delete(board);
  }

  /**
  * 게시물 추천
  */
  public void addRecommendation(Long boardId, String email) {
    Member member = memberRepository.findByMember_Email(email)
      .orElseThrow(() -> new IllegalArgumentException("해당 회원을 찾을 수 없습니다."));
    Board board = boardRepository.findById(boardId)
      .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

    // 중복 추천 확인
    if (boardRecommendRepository.existsByMemberAndBoard(member, board)) {
      throw new IllegalStateException("이미 추천한 게시글입니다.");
    }

    // 추천 기록 생성 및 저장
    BoardRecommend boardRecommend = new BoardRecommend();
    boardRecommend.setMember(member);
    boardRecommend.setBoard(board);
    boardRecommendRepository.save(boardRecommend);

    // 해당 게시물 추천수 1 증가
    board.setLikeCount(board.getLikeCount() + 1);
  }

  @Transactional
  public void blindBoard(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
    if (!board.isBlinded()) {
        board.setOriginalTitle(board.getTitle());
        board.setOriginalContent(board.getContent());
        board.setTitle(cleanBotService.filter(board.getTitle()));
        board.setContent(cleanBotService.filter(board.getContent()));
        board.setBlinded(true);
        boardRepository.save(board);
    }
  }

  @Transactional
  public void unblindBoard(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
    if (board.isBlinded() && board.getOriginalContent() != null && board.getOriginalTitle() != null) {
        board.setTitle(board.getOriginalTitle());
        board.setContent(board.getOriginalContent());
        board.setBlinded(false);
        boardRepository.save(board);
    }
  }

  @Transactional(readOnly = true)
  public String getOriginalContent(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
    return board.getOriginalContent();
  }

  @Transactional(readOnly = true)
  public String getOriginalTitle(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
    return board.getOriginalTitle();
  }

  @Transactional
  public void deleteBoardByAdmin(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
    boardRecommendRepository.deleteAllByBoard_Id(boardId);
    commentRepository.deleteAllByBoard_Id(boardId);
    boardRepository.delete(board);
  }

  @Transactional
  public void updateBoardByAdmin(Long boardId, BoardUpdateDto requestDto) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));
    
    if (requestDto.getTitle() != null) {
      String filteredTitle = cleanBotService.filter(requestDto.getTitle());
      board.setTitle(filteredTitle);
      
      // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
      if (cleanBotService.containsProfanity(requestDto.getTitle())) {
        board.setOriginalTitle(requestDto.getTitle());
        board.setBlinded(true);
      }
    }
    
    if (requestDto.getContent() != null) {
      String filteredContent = cleanBotService.filter(requestDto.getContent());
      board.setContent(filteredContent);
      
      // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
      if (cleanBotService.containsProfanity(requestDto.getContent())) {
        board.setOriginalContent(requestDto.getContent());
        board.setBlinded(true);
      }
    }
    
    if (requestDto.getBoardKind() != null) board.setBoardKind(requestDto.getBoardKind());
    if (requestDto.getHashTag() != null) board.setHashTag(requestDto.getHashTag());
  }

  @Transactional(readOnly = true)
  public List<BoardListDto> getBoardListByKind(BoardKind boardKind) {
    List<Board> boards = boardRepository.findAll().stream()
        .filter(b -> b.getBoardKind() == boardKind)
        .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
        .toList();
    return boards.stream().map(BoardListDto::from).toList();
  }

  /**
   * 기존 게시글들 중 클린봇이 감지했지만 blinded 필드가 설정되지 않은 게시글들을 업데이트
   */
  @Transactional
  public void updateExistingBlindedPosts() {
    List<Board> allBoards = boardRepository.findAll();
    
    for (Board board : allBoards) {
      // 이미 blinded가 true인 게시글은 건너뛰기
      if (board.isBlinded()) {
        continue;
      }
      
      // 제목이나 내용에 부적절한 단어가 포함되어 있는지 확인
      boolean hasProfanityInTitle = cleanBotService.containsProfanity(board.getTitle());
      boolean hasProfanityInContent = cleanBotService.containsProfanity(board.getContent());
      
      if (hasProfanityInTitle || hasProfanityInContent) {
        // 원본 내용 저장
        if (board.getOriginalTitle() == null) {
          board.setOriginalTitle(board.getTitle());
        }
        if (board.getOriginalContent() == null) {
          board.setOriginalContent(board.getContent());
        }
        
        // blinded 상태로 설정
        board.setBlinded(true);
        
        // 필터링된 내용으로 업데이트
        if (hasProfanityInTitle) {
          board.setTitle(cleanBotService.filter(board.getTitle()));
        }
        if (hasProfanityInContent) {
          board.setContent(cleanBotService.filter(board.getContent()));
        }
      }
    }
  }

  /**
   * id로 게시글 엔티티를 조회하는 메서드
   */
  @Transactional(readOnly = true)
  public Board getBoardById(Long id) {
    return boardRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 없습니다."));
  }
}
