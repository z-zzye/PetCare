// BoardController.java (수정 완료)

package com.petory.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.petory.dto.board.BoardCreateDto;
import com.petory.dto.board.BoardDetailDto;
import com.petory.dto.board.BoardListDto;
import com.petory.dto.board.BoardUpdateDto;
import com.petory.service.BoardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {
  private final BoardService boardService;

  // 게시글 생성 API
  @PostMapping
  public ResponseEntity<Long> createBoard(
    @Valid @RequestBody BoardCreateDto requestDto,
    @AuthenticationPrincipal UserDetails userDetails) {
    Long savedBoardId = boardService.createBoard(requestDto, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED).body(savedBoardId);
  }

  // 게시글 목록 조회 API
  @GetMapping("/{category}")
  public ResponseEntity<Page<BoardListDto>> getBoardList(
    @PathVariable String category,
    @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    Page<BoardListDto> boardList = boardService.getBoardList(category, pageable);
    return ResponseEntity.ok(boardList);
  }

  // ▼▼▼ 경로 충돌을 해결하기 위해 아래 API들의 URL을 수정합니다. ▼▼▼

  // 게시글 상세 조회 API
  @GetMapping("/{category}/{boardId}") // 경로를 더 명확하게 변경
  public ResponseEntity<BoardDetailDto> getBoardDetail(
    @PathVariable String category, // category 변수 추가 (현재 로직에서는 사용되지 않지만 경로 구분을 위해 필요)
    @PathVariable Long boardId) {
    BoardDetailDto boardDetail = boardService.getBoardDetail(boardId);
    return ResponseEntity.ok(boardDetail);
  }

  // 게시글 수정 API
  @PatchMapping("/{category}/{boardId}") // 경로를 더 명확하게 변경
  public ResponseEntity<Void> updateBoard (
    @PathVariable String category,
    @PathVariable Long boardId,
    @RequestBody BoardUpdateDto updateDto,
    @AuthenticationPrincipal UserDetails userDetails) {
    boardService.updateBoard(boardId, updateDto, userDetails.getUsername());
    return ResponseEntity.ok().build();
  }

  // 게시글 삭제 API
  @DeleteMapping("/{category}/{boardId}") // 경로를 더 명확하게 변경
  public ResponseEntity<Void> deleteBoard(
    @PathVariable String category,
    @PathVariable Long boardId,
    @AuthenticationPrincipal UserDetails userDetails) {
    boardService.deleteBoard(boardId, userDetails.getUsername());
    return ResponseEntity.noContent().build();
  }

  // 게시물 추천 API
  @PostMapping("/{category}/{boardId}/recommend")
  public ResponseEntity<Void> addRecommendation(
          @PathVariable Long boardId,
          @AuthenticationPrincipal UserDetails userDetails) {
    try {
      boardService.addRecommendation(boardId, userDetails.getUsername());
      return ResponseEntity.ok().build();
    } catch (IllegalStateException e) {
      // 이미 추천한 경우 409 Conflict 상태 코드 반환
      return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }
  }

  // ▼▼▼ 해시태그 검색 API들 추가 ▼▼▼

  // 단일 해시태그로 게시글 검색 API
  @GetMapping("/search/hashtag")
  public ResponseEntity<Page<BoardListDto>> searchBoardsByHashtag(
    @RequestParam String hashtag,
    @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    try {
      Page<BoardListDto> boardList = boardService.searchBoardsByHashtag(hashtag, pageable);
      return ResponseEntity.ok(boardList);
    } catch (IllegalArgumentException e) {
      // 존재하지 않는 해시태그인 경우 빈 페이지 반환
      return ResponseEntity.ok(Page.empty(pageable));
    }
  }

  // 여러 해시태그로 게시글 검색 API (OR 조건)
  @GetMapping("/search/hashtags")
  public ResponseEntity<Page<BoardListDto>> searchBoardsByHashtags(
    @RequestParam List<String> hashtags,
    @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    Page<BoardListDto> boardList = boardService.searchBoardsByHashtags(hashtags, pageable);
    return ResponseEntity.ok(boardList);
  }

  // 카테고리별 해시태그 검색 API (효율적인 버전)
  @GetMapping("/{category}/search/hashtag")
  public ResponseEntity<Page<BoardListDto>> searchBoardsByCategoryAndHashtag(
    @PathVariable String category,
    @RequestParam String hashtag,
    @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    try {
      Page<BoardListDto> boardList = boardService.searchBoardsByCategoryAndHashtag(category, hashtag, pageable);
      return ResponseEntity.ok(boardList);
    } catch (IllegalArgumentException e) {
      // 존재하지 않는 해시태그인 경우 빈 페이지 반환
      return ResponseEntity.ok(Page.empty(pageable));
    }
  }

  // 카테고리별 여러 해시태그 검색 API (효율적인 버전)
  @GetMapping("/{category}/search/hashtags")
  public ResponseEntity<Page<BoardListDto>> searchBoardsByCategoryAndHashtags(
    @PathVariable String category,
    @RequestParam List<String> hashtags,
    @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    Page<BoardListDto> boardList = boardService.searchBoardsByCategoryAndHashtags(category, hashtags, pageable);
    return ResponseEntity.ok(boardList);
  }

  // 게시글 작성용 해시태그 목록 조회 API
  @GetMapping("/hashtags/for-write")
  public ResponseEntity<List<String>> getHashtagsForWrite() {
    // 인기 해시태그 상위 20개 반환 (게시글 작성 시 선택용)
    List<String> popularHashtags = boardService.getPopularHashtagsForWrite();
    return ResponseEntity.ok(popularHashtags);
  }
}
