package com.petory.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.dto.board.PopularBoardDto;
import com.petory.entity.Board;
import com.petory.repository.BoardRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainService {

    private final BoardRepository boardRepository;

    /**
     * 최근 일주일 인기 게시글 조회
     * @param limit 조회할 게시글 개수
     * @return 인기 게시글 목록
     */
    public List<PopularBoardDto> getPopularPosts(int limit) {
        log.info("인기 게시글 조회 시작 - limit: {}", limit);
        
        // 일주일 전 시점 계산
        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
        
        // 페이징 설정 (추천수 내림차순, 최신순)
        Pageable pageable = PageRequest.of(0, limit);
        
        // 인기 게시글 조회
        List<Board> popularBoards = boardRepository.findPopularPostsInLastWeek(weekAgo, pageable);
        
        // DTO 변환
        List<PopularBoardDto> popularBoardDtos = popularBoards.stream()
                .map(this::convertToPopularBoardDto)
                .collect(Collectors.toList());
        
        log.info("인기 게시글 조회 완료 - 조회된 게시글 수: {}", popularBoardDtos.size());
        
        return popularBoardDtos;
    }

    /**
     * Board 엔티티를 PopularBoardDto로 변환
     * @param board Board 엔티티
     * @return PopularBoardDto
     */
    private PopularBoardDto convertToPopularBoardDto(Board board) {
        return PopularBoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .author(board.getMember().getMember_NickName()) // Member의 닉네임
                .viewCount(board.getViewCount())
                .likeCount(board.getLikeCount())
                .category(board.getBoardKind().toString()) // BoardKind enum 값
                .createdAt(board.getRegDate()) // BaseTimeEntity의 regDate (실제 필드명)
                .build();
    }

    // TODO: 나중에 추가될 메인페이지 전용 기능들
    /*
    public List<RecommendedBoardDto> getRecommendedPosts(int limit) {
        // 관심사 기반 추천 게시글 조회
    }
    
    public List<InfoPostDto> getInfoPosts(int limit) {
        // 정보글 조회
    }
    
    public MainStatsDto getMainStats() {
        // 메인페이지 통계 데이터 조회
    }
    */
}
