package com.petory.dto.board;

import com.petory.constant.BoardKind;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// 게시판 생성 DTO

@Getter
@Setter
public class BoardCreateDto {
  @NotBlank(message = "제목을 입력해주세요.")
  private String title;

  @NotBlank(message = "내용을 입력해주세요.")
  private String content;

  private BoardKind boardKind;
  private String hashTag;
}
