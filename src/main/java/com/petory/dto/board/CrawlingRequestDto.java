package com.petory.dto.board;

import java.util.List;

import com.petory.constant.BoardKind;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrawlingRequestDto {
    @NotBlank(message = "크롤링할 URL을 입력해주세요.")
    private String url;
    
    @NotBlank(message = "제목을 입력해주세요.")
    private String title;
    
    @NotNull(message = "게시판 종류를 선택해주세요.")
    private BoardKind boardKind;
    
    // 선택적 해시태그
    private List<String> hashtags;
    
    // 크롤링 설정
    private String titleSelector; // 제목을 추출할 CSS 선택자
    private String contentSelector; // 내용을 추출할 CSS 선택자
    private String imageSelector; // 이미지를 추출할 CSS 선택자 (선택사항)
} 