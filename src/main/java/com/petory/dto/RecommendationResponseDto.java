package com.petory.dto;

import java.util.List;

import com.petory.dto.board.BoardListDto;

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
public class RecommendationResponseDto {
    
    private String recommendationType;        // "personalized" 또는 "popular_hashtags"
    private List<String> selectedHashtags;    // 선택된 해시태그 목록
    private List<BoardListDto> posts;         // 추천 게시글 목록
    private String message;                   // 추천 이유 메시지
    
} 