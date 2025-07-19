package com.petory.dto.board;

import java.util.List;

import com.petory.constant.BoardKind;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// 게시물 수정 DTO

@Getter
@Setter
public class BoardUpdateDto {
  @NotBlank(message = "제목을 입력해주세요.")
  private String title;
  @NotBlank(message = "내용을 입력해주세요.")
  private String content;

  private BoardKind boardKind;
  
  // 해시태그 리스트 필드
  private List<String> hashtags;
}
