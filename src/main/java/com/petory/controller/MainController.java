package com.petory.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.petory.config.CustomUserDetails;
import com.petory.dto.RecommendationResponseDto;
import com.petory.dto.board.PopularBoardDto;
import com.petory.service.MainService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/main")
public class MainController {

    private final MainService mainService;

    @GetMapping("/")
    public String main() {
        return "main";
    }

    /**
     * 인기 게시글 조회 API
     * @param limit 조회할 게시글 개수 (기본값: 4)
     * @return 인기 게시글 목록
     */
    @GetMapping("/popular")
    public ResponseEntity<List<PopularBoardDto>> getPopularPosts(
            @RequestParam(defaultValue = "4") int limit
    ) {
        log.info("인기 게시글 조회 요청 - limit: {}", limit);
        
        try {
            List<PopularBoardDto> popularPosts = mainService.getPopularPosts(limit);
            log.info("인기 게시글 조회 성공 - 조회된 게시글 수: {}", popularPosts.size());
            
            return ResponseEntity.ok(popularPosts);
        } catch (Exception e) {
            log.error("인기 게시글 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 추천 게시글 조회 API
     * @param limit 조회할 게시글 개수 (기본값: 5)
     * @param userDetails 현재 로그인한 사용자 정보
     * @return 추천 게시글 목록
     */
    @GetMapping("/recommended")
    public ResponseEntity<RecommendationResponseDto> getRecommendedPosts(
            @RequestParam(defaultValue = "5") int limit,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        log.info("추천 게시글 조회 요청 - limit: {}", limit);
        
        try {
            String userEmail = userDetails != null ? userDetails.getUsername() : null;
            RecommendationResponseDto recommendation = mainService.getRecommendedPosts(userEmail, limit);
            log.info("추천 게시글 조회 성공 - 추천 타입: {}, 게시글 수: {}", 
                    recommendation.getRecommendationType(), recommendation.getPosts().size());
            
            return ResponseEntity.ok(recommendation);
        } catch (Exception e) {
            log.error("추천 게시글 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
