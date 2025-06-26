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
  @PostMapping
  public ResponseEntity<?> createBoard(
    @Valid @RequestBody BoardCreateDto requestDto,
    @AuthenticationPrincipal UserDetails userDetails) {

    // --- 디버깅을 위한 코드 시작 ---
    try {
      // 1. 로그인 상태를 명시적으로 확인합니다.
      if (userDetails == null) {
        // 이 에러가 보인다면, API 호출 시 로그인이 되어있지 않다는 뜻입니다.
        System.err.println("CRITICAL ERROR: userDetails is null. User is not authenticated.");
        return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED) // 401 Unauthorized
          .body("로그인이 필요합니다. API 테스트 전에 먼저 웹사이트에 로그인해주세요.");
      }

      // 로그인 성공 시, 콘솔에 사용자 이메일을 출력합니다.
      System.out.println("User authenticated. Email: " + userDetails.getUsername());

      // 2. 실제 서비스 로직을 호출합니다.
      Long savedBoardId = boardService.createBoard(requestDto, userDetails.getUsername());

      System.out.println("Board created successfully. Board ID: " + savedBoardId);

      // 3. 성공 응답을 반환합니다.
      return ResponseEntity.status(HttpStatus.CREATED).body(savedBoardId);

    } catch (Exception e) {
      // 4. 어떤 종류의 예외가 발생하든, 콘솔에 강제로 전체 에러 내용을 출력합니다.
      System.err.println("An exception occurred in createBoard controller: " + e.getMessage());
      e.printStackTrace(); // 전체 스택 트레이스를 콘솔에 출력합니다.

      // 5. API 테스트 폼에도 상세한 에러 메시지를 전달합니다.
      return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("서버 내부 오류 발생: " + e.getMessage());
    }
    // --- 디버깅을 위한 코드 끝 ---
  }
//  @PostMapping
//  public ResponseEntity<Long> createBoard (
//        @Valid @RequestBody BoardCreateDto boardCreateDto,
//        @AuthenticationPrincipal UserDetails userDetails) { // 현재 로그인한 사용자 정보 받아옴
//
//    Long savedBoardId = boardService.createBoard(boardCreateDto, userDetails.getUsername());
//
//    return ResponseEntity.status(HttpStatus.CREATED).body(savedBoardId);
//  }

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
