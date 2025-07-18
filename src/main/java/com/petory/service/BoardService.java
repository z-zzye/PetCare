package com.petory.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.constant.BoardKind;
import com.petory.dto.board.BoardCreateDto;
import com.petory.dto.board.BoardDetailDto;
import com.petory.dto.board.BoardListDto;
import com.petory.dto.board.BoardUpdateDto;
import com.petory.entity.Board;
import com.petory.entity.BoardHashtag;
import com.petory.entity.BoardHashtagId;
import com.petory.entity.BoardImage;
import com.petory.entity.BoardRecommend;
import com.petory.entity.CleanBotLog;
import com.petory.entity.Comment;
import com.petory.entity.Hashtag;
import com.petory.entity.Member;
import com.petory.repository.BoardHashtagRepository;
import com.petory.repository.BoardImageRepository;
import com.petory.repository.BoardRecommendRepository;
import com.petory.repository.BoardRepository;
import com.petory.repository.CleanBotLogRepository;
import com.petory.repository.CommentRepository;
import com.petory.repository.HashtagRepository;
import com.petory.repository.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class BoardService {

  private final BoardRepository boardRepository;
  private final MemberRepository memberRepository;
  private final CommentRepository commentRepository;
  private final CleanBotService cleanBotService;
  private final HttpServletRequest httpServletRequest;
  private final BoardRecommendRepository boardRecommendRepository;
  private final NotificationService notificationService;
  private final CleanBotLogRepository cleanBotLogRepository;
  private final HashtagRepository hashtagRepository;
  private final BoardHashtagRepository boardHashtagRepository;
  private final BoardImageRepository boardImageRepository;

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
    board.setMember(member);

    // 클린봇이 부적절한 내용을 감지한 경우 블라인드 처리
    if (cleanBotService.containsProfanity(requestDto.getTitle()) ||
        cleanBotService.containsProfanity(requestDto.getContent())) {
      board.setOriginalTitle(requestDto.getTitle());
      board.setOriginalContent(requestDto.getContent());
      board.setBlinded(true);
      
      // 클린봇 감지 알림 생성
      try {
        notificationService.createCleanBotDetectedNotification(member, requestDto.getTitle() + " " + requestDto.getContent());
      } catch (Exception e) {
        log.error("클린봇 감지 알림 생성 중 오류 발생: memberId={}", member.getMember_Id(), e);
        // 알림 생성 실패가 게시글 생성을 막지 않도록 예외를 던지지 않음
      }
    }

    Board savedBoard = boardRepository.save(board);
    
    // 해시태그 처리
    if (requestDto.getHashtags() != null && !requestDto.getHashtags().isEmpty()) {
      saveBoardHashtags(savedBoard, requestDto.getHashtags());
    }
    
    // 클린봇이 부적절한 내용을 감지한 경우 로그 저장
    if (savedBoard.isBlinded()) {
      try {
        CleanBotLog cleanBotLog = new CleanBotLog();
        cleanBotLog.setTargetId(savedBoard.getId());
        cleanBotLog.setTargetType("BOARD");
        cleanBotLog.setOriginalContent(savedBoard.getOriginalContent());
        cleanBotLogRepository.save(cleanBotLog);
        log.info("클린봇 로그 저장 완료: Board ID={}", savedBoard.getId());
      } catch (Exception e) {
        log.error("클린봇 로그 저장 중 오류 발생: Board ID={}", savedBoard.getId(), e);
        // 로그 저장 실패가 게시글 생성을 막지 않도록 예외를 던지지 않음
      }
    }
    
    return savedBoard.getId();
  }

  /**
   * 게시글 목록 조회 (페이징 처리)
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> getBoardList(Pageable pageable) {
    // Board 엔티티 페이지를 BoardListResponseDto 페이지로 변환하여 반환
    return boardRepository.findAll(pageable).map(board -> {
      List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
      return BoardListDto.from(board, boardHashtags);
    });
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
      .map(board -> {
        List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
        return BoardListDto.from(board, boardHashtags);
      });
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
    
    // 해당 게시글의 해시태그 목록 조회
    List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(boardId);
    
    // 해당 게시글의 이미지 목록 조회
    List<BoardImage> boardImages = boardImageRepository.findByBoardIdOrderByDisplayOrderAsc(boardId);
    
    return BoardDetailDto.from(board, comments, boardHashtags, boardImages);
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
    
    // 해시태그 업데이트
    if (requestDto.getHashtags() != null) {
      // 기존 해시태그 사용 횟수 감소 및 삭제
      List<BoardHashtag> existingBoardHashtags = boardHashtagRepository.findByPostId(boardId);
      for (BoardHashtag boardHashtag : existingBoardHashtags) {
        Hashtag hashtag = boardHashtag.getHashtag();
        if (hashtag.getTagCount() > 0) {
          hashtag.setTagCount(hashtag.getTagCount() - 1);
          hashtagRepository.save(hashtag);
        }
      }
      boardHashtagRepository.deleteByPostId(boardId);
      
      // 새로운 해시태그 저장
      if (!requestDto.getHashtags().isEmpty()) {
        saveBoardHashtags(board, requestDto.getHashtags());
      }
    }

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
    
    // 해시태그 사용 횟수 감소 및 연결 삭제
    List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(boardId);
    for (BoardHashtag boardHashtag : boardHashtags) {
      Hashtag hashtag = boardHashtag.getHashtag();
      if (hashtag.getTagCount() > 0) {
        hashtag.setTagCount(hashtag.getTagCount() - 1);
        hashtagRepository.save(hashtag);
      }
    }
    boardHashtagRepository.deleteByPostId(boardId);
    
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
    
    // 해시태그 사용 횟수 감소 및 연결 삭제
    List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(boardId);
    for (BoardHashtag boardHashtag : boardHashtags) {
      Hashtag hashtag = boardHashtag.getHashtag();
      if (hashtag.getTagCount() > 0) {
        hashtag.setTagCount(hashtag.getTagCount() - 1);
        hashtagRepository.save(hashtag);
      }
    }
    boardHashtagRepository.deleteByPostId(boardId);
    
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
    
    // 해시태그 업데이트
    if (requestDto.getHashtags() != null) {
      // 기존 해시태그 사용 횟수 감소 및 삭제
      List<BoardHashtag> existingBoardHashtags = boardHashtagRepository.findByPostId(boardId);
      for (BoardHashtag boardHashtag : existingBoardHashtags) {
        Hashtag hashtag = boardHashtag.getHashtag();
        if (hashtag.getTagCount() > 0) {
          hashtag.setTagCount(hashtag.getTagCount() - 1);
          hashtagRepository.save(hashtag);
        }
      }
      boardHashtagRepository.deleteByPostId(boardId);
      
      // 새로운 해시태그 저장
      if (!requestDto.getHashtags().isEmpty()) {
        saveBoardHashtags(board, requestDto.getHashtags());
      }
    }
  }

  @Transactional(readOnly = true)
  public List<BoardListDto> getBoardListByKind(BoardKind boardKind) {
    List<Board> boards = boardRepository.findAll().stream()
        .filter(b -> b.getBoardKind() == boardKind)
        .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
        .toList();
    return boards.stream().map(board -> {
      List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
      return BoardListDto.from(board, boardHashtags);
    }).toList();
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

  /**
   * 해시태그로 게시글 검색
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> searchBoardsByHashtag(String hashtagName, Pageable pageable) {
    // 해시태그 이름으로 해시태그 찾기
    Hashtag hashtag = hashtagRepository.findByTagName(hashtagName)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 해시태그입니다: " + hashtagName));
    
    // 해당 해시태그를 가진 게시글 ID 목록 조회
    List<Long> boardIds = boardHashtagRepository.findBoardIdsByTagId(hashtag.getTagId());
    
    if (boardIds.isEmpty()) {
      // 해당 해시태그를 가진 게시글이 없는 경우 빈 페이지 반환
      return Page.empty(pageable);
    }
    
    // 게시글 ID 목록으로 게시글 조회
    List<Board> boards = boardRepository.findAllById(boardIds);
    
    // 페이징 처리
    int start = (int) pageable.getOffset();
    int end = Math.min((start + pageable.getPageSize()), boards.size());
    
    if (start > boards.size()) {
      return Page.empty(pageable);
    }
    
    List<Board> pagedBoards = boards.subList(start, end);
    
    // BoardListDto로 변환
    List<BoardListDto> boardListDtos = pagedBoards.stream()
        .map(board -> {
          List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
          return BoardListDto.from(board, boardHashtags);
        })
        .toList();
    
    return new org.springframework.data.domain.PageImpl<>(
        boardListDtos, 
        pageable, 
        boards.size()
    );
  }

  /**
   * 여러 해시태그로 게시글 검색 (OR 조건)
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> searchBoardsByHashtags(List<String> hashtagNames, Pageable pageable) {
    if (hashtagNames == null || hashtagNames.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 해시태그 이름으로 해시태그 ID 목록 조회
    List<Long> hashtagIds = hashtagNames.stream()
        .map(name -> hashtagRepository.findByTagName(name))
        .filter(java.util.Optional::isPresent)
        .map(java.util.Optional::get)
        .map(Hashtag::getTagId)
        .toList();
    
    if (hashtagIds.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 해당 해시태그들을 가진 게시글 ID 목록 조회 (OR 조건)
    List<Long> boardIds = boardHashtagRepository.findBoardIdsByTagIds(hashtagIds);
    
    if (boardIds.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 게시글 ID 목록으로 게시글 조회
    List<Board> boards = boardRepository.findAllById(boardIds);
    
    // 페이징 처리
    int start = (int) pageable.getOffset();
    int end = Math.min((start + pageable.getPageSize()), boards.size());
    
    if (start > boards.size()) {
      return Page.empty(pageable);
    }
    
    List<Board> pagedBoards = boards.subList(start, end);
    
    // BoardListDto로 변환
    List<BoardListDto> boardListDtos = pagedBoards.stream()
        .map(board -> {
          List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
          return BoardListDto.from(board, boardHashtags);
        })
        .toList();
    
    return new org.springframework.data.domain.PageImpl<>(
        boardListDtos, 
        pageable, 
        boards.size()
    );
  }

  /**
   * 게시글에 해시태그 연결
   */
  private void saveBoardHashtags(Board board, List<String> hashtagNames) {
    for (String hashtagName : hashtagNames) {
      if (hashtagName != null && !hashtagName.trim().isEmpty()) {
        // 해시태그가 존재하는지 확인하고, 없으면 생성
        Hashtag hashtag = hashtagRepository.findByTagName(hashtagName.trim())
          .orElseGet(() -> {
            Hashtag newHashtag = Hashtag.builder()
              .tagName(hashtagName.trim())
              .tagCount(0)
              .build();
            return hashtagRepository.save(newHashtag);
          });
        
        // BoardHashtag 생성
        BoardHashtagId boardHashtagId = new BoardHashtagId();
        boardHashtagId.setPostId(board.getId());
        boardHashtagId.setTagId(hashtag.getTagId());
        
        BoardHashtag boardHashtag = BoardHashtag.builder()
          .id(boardHashtagId)
          .board(board)
          .hashtag(hashtag)
          .build();
        
        boardHashtagRepository.save(boardHashtag);
        
        // 해시태그 사용 횟수 증가
        hashtag.setTagCount(hashtag.getTagCount() + 1);
        hashtagRepository.save(hashtag);
      }
    }
  }

  /**
   * 게시글 작성용 인기 해시태그 목록 조회
   */
  @Transactional(readOnly = true)
  public List<String> getPopularHashtagsForWrite() {
    return hashtagRepository.findAllByOrderByTagCountDesc().stream()
        .limit(20) // 상위 20개만 반환
        .map(Hashtag::getTagName)
        .toList();
  }

  /**
   * 해시태그 검색 (검색어가 있으면 전체에서 검색, 없으면 인기순 상위 10개)
   */
  @Transactional(readOnly = true)
  public List<String> searchHashtagsForWrite(String searchKeyword) {
    if (searchKeyword == null || searchKeyword.trim().isEmpty()) {
      // 검색어가 없으면 인기순 상위 10개 반환
      return hashtagRepository.findAllByOrderByTagCountDesc().stream()
          .limit(10)
          .map(Hashtag::getTagName)
          .toList();
    } else {
      // 검색어가 있으면 전체 해시태그에서 검색 (대소문자 구분 없이)
      return hashtagRepository.findByTagNameContainingIgnoreCase(searchKeyword.trim()).stream()
          .map(Hashtag::getTagName)
          .toList();
    }
  }

  /**
   * 카테고리별 해시태그로 게시글 검색 (효율적인 버전)
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> searchBoardsByCategoryAndHashtag(String category, String hashtagName, Pageable pageable) {
    // 1. 문자열로 받은 category를 BoardKind Enum으로 변환
    BoardKind boardKind = BoardKind.valueOf(category.toUpperCase());
    
    // 2. 해시태그 이름으로 해시태그 찾기
    Hashtag hashtag = hashtagRepository.findByTagName(hashtagName)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 해시태그입니다: " + hashtagName));
    
    // 3. 해당 카테고리와 해시태그를 가진 게시글 ID 목록 조회
    List<Long> boardIds = boardHashtagRepository.findBoardIdsByTagIdAndBoardKind(hashtag.getTagId(), boardKind.name());
    
    if (boardIds.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 4. 게시글 ID 목록으로 게시글 조회
    List<Board> boards = boardRepository.findAllById(boardIds);
    
    // 5. 페이징 처리
    int start = (int) pageable.getOffset();
    int end = Math.min((start + pageable.getPageSize()), boards.size());
    
    if (start > boards.size()) {
      return Page.empty(pageable);
    }
    
    List<Board> pagedBoards = boards.subList(start, end);
    
    // 6. BoardListDto로 변환
    List<BoardListDto> boardListDtos = pagedBoards.stream()
        .map(board -> {
          List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
          return BoardListDto.from(board, boardHashtags);
        })
        .toList();
    
    return new org.springframework.data.domain.PageImpl<>(
        boardListDtos, 
        pageable, 
        boards.size()
    );
  }

  /**
   * 카테고리별 여러 해시태그로 게시글 검색 (효율적인 버전)
   */
  @Transactional(readOnly = true)
  public Page<BoardListDto> searchBoardsByCategoryAndHashtags(String category, List<String> hashtagNames, Pageable pageable) {
    if (hashtagNames == null || hashtagNames.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 1. 문자열로 받은 category를 BoardKind Enum으로 변환
    BoardKind boardKind = BoardKind.valueOf(category.toUpperCase());
    
    // 2. 해시태그 이름으로 해시태그 ID 목록 조회
    List<Long> hashtagIds = hashtagNames.stream()
        .map(name -> hashtagRepository.findByTagName(name))
        .filter(java.util.Optional::isPresent)
        .map(java.util.Optional::get)
        .map(Hashtag::getTagId)
        .toList();
    
    if (hashtagIds.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 3. 해당 카테고리와 해시태그들을 가진 게시글 ID 목록 조회 (OR 조건)
    List<Long> boardIds = boardHashtagRepository.findBoardIdsByTagIdsAndBoardKind(hashtagIds, boardKind.name());
    
    if (boardIds.isEmpty()) {
      return Page.empty(pageable);
    }
    
    // 4. 게시글 ID 목록으로 게시글 조회
    List<Board> boards = boardRepository.findAllById(boardIds);
    
    // 5. 페이징 처리
    int start = (int) pageable.getOffset();
    int end = Math.min((start + pageable.getPageSize()), boards.size());
    
    if (start > boards.size()) {
      return Page.empty(pageable);
    }
    
    List<Board> pagedBoards = boards.subList(start, end);
    
    // 6. BoardListDto로 변환
    List<BoardListDto> boardListDtos = pagedBoards.stream()
        .map(board -> {
          List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
          return BoardListDto.from(board, boardHashtags);
        })
        .toList();
    
    return new org.springframework.data.domain.PageImpl<>(
        boardListDtos, 
        pageable, 
        boards.size()
    );
  }
}
