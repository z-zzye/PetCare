package com.petory.controller;

import com.petory.dto.CommentCreateDto;
import com.petory.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards/{boardId}/comments")
@RequiredArgsConstructor
public class CommentController {
  private final CommentService commentService;

  // 새 댓글 생성 API
  @PostMapping
  public ResponseEntity<Long> createComment(
            @PathVariable Long boardId,
            @Valid @RequestBody CommentCreateDto createDto,
            @AuthenticationPrincipal UserDetails userDetails) {

    Long savedCommentId = commentService.createComment(boardId, createDto, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED).body(savedCommentId);
  }

  // 댓글 삭제 API
  @DeleteMapping("/{commentId}")
  public ResponseEntity<Void> deleteComment(
    @PathVariable Long boardId,
    @PathVariable Long commentId,
    @AuthenticationPrincipal UserDetails userDetails) {

    commentService.deleteComment(commentId, userDetails.getUsername());
    return ResponseEntity.noContent().build();
  }
}
