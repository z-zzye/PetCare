package com.petory.controller;

import com.petory.dto.*;
import com.petory.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {
  private final BoardService boardService;

  // 게시글 생성 API
  // 게시판 테스트로 인한 변경 사항 있음
  // 정상 작동 원할 시 두 주석처리된 코드 복구 후 테스트용 코드 삭제
  @PostMapping
  public ResponseEntity<Long> createBoard(
    @Valid @RequestBody BoardCreateDto requestDto,
    @AuthenticationPrincipal UserDetails userDetails) {

    Long savedBoardId = boardService.createBoard(requestDto, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED).body(savedBoardId);
  }

  // 게시글 목록 조회 API (페이징, 수정 예정)
  @GetMapping
  public ResponseEntity<Page<BoardListDto>> getBoardList(
        // id의 내림차순으로 10개씩 조회
        @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC)Pageable pageable) {

    Page<BoardListDto> boardList = boardService.getBoardList(pageable);
    return ResponseEntity.ok(boardList);
  }

  // 게시글 상세 조회 API
  @GetMapping("/{boardId}")
  public ResponseEntity<BoardDetailDto> getBoardDetail(@PathVariable Long boardId) {
    BoardDetailDto boardDetail = boardService.getBoardDetail(boardId);
    return ResponseEntity.ok(boardDetail);
  }

  // 게시글 수정 API
  @PatchMapping("/{boardId}")
  public ResponseEntity<Void> updateBoard (
        @PathVariable Long boardId,
        @RequestBody BoardUpdateDto updateDto,
        @AuthenticationPrincipal UserDetails userDetails) {

    boardService.updateBoard(boardId, updateDto, userDetails.getUsername());
    return ResponseEntity.ok().build();
  }

  // 게시글 삭제 API
  @DeleteMapping("/{boardId}")
  public ResponseEntity<Void> deleteBoard(
            @PathVariable Long boardId,
            @AuthenticationPrincipal UserDetails userDetails) {
   boardService.deleteBoard(boardId, userDetails.getUsername());
   return ResponseEntity.noContent().build();
  }
}
