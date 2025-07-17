package com.petory.dto.board;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularBoardDto {
    
    private Long id;                    // 게시글 ID
    private String title;               // 제목
    private String author;              // 작성자 닉네임
    private int viewCount;              // 조회수
    private int likeCount;              // 추천수 (인기 순위 기준)
    private String category;            // 게시판 종류 (BoardKind)
    private LocalDateTime createdAt;    // 작성일
    
    // 나중에 해시태그 기능 추가 시 확장 가능
    // private List<String> hashtags;
} 