package com.petory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// 댓글 생성 DTO

@Getter
@Setter
public class CommentCreateDto {

  @NotBlank(message = "댓글 내용은 필수입니다.")
  private String content;
}
