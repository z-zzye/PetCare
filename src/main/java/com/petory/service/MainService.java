package com.petory.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.petory.dto.HashtagDto;
import com.petory.dto.RecommendationResponseDto;
import com.petory.dto.board.BoardListDto;
import com.petory.dto.board.PopularBoardDto;
import com.petory.entity.Board;
import com.petory.entity.BoardHashtag;
import com.petory.entity.Member;
import com.petory.entity.MemberHashtag;
import com.petory.repository.BoardHashtagRepository;
import com.petory.repository.BoardRepository;
import com.petory.repository.MemberHashtagRepository;
import com.petory.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainService {

    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final MemberHashtagRepository memberHashtagRepository;
    private final BoardHashtagRepository boardHashtagRepository;

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
     * 추천 게시글 조회
     * @param userEmail 사용자 이메일 (null일 수 있음)
     * @param limit 조회할 게시글 개수
     * @return 추천 게시글 응답
     */
    public RecommendationResponseDto getRecommendedPosts(String userEmail, int limit) {
        log.info("추천 게시글 조회 시작 - userEmail: {}, limit: {}", userEmail, limit);
        
        // 사용자가 로그인하지 않은 경우 - 인기 해시태그 기반 추천 우선 시도
        if (userEmail == null) {
            return getPopularHashtagRecommendationsForGuest(limit);
        }
        
        // 사용자 정보 조회
        Member member = memberRepository.findByMember_Email(userEmail).orElse(null);
        if (member == null) {
            log.warn("사용자를 찾을 수 없음: {}", userEmail);
            return getPopularHashtagRecommendationsForGuest(limit);
        }
        
        // 사용자의 선호 해시태그 조회
        List<MemberHashtag> userHashtags = memberHashtagRepository.findByMember(member);
        
        // 선호 해시태그가 있는 경우 개인화된 추천
        if (!userHashtags.isEmpty()) {
            return getPersonalizedRecommendations(userHashtags, limit);
        }
        
        // 선호 해시태그가 없는 경우 인기 해시태그 기반 추천
        return getPopularHashtagRecommendations(limit);
    }

    /**
     * 개인화된 추천 (선호 해시태그 기반)
     */
    private RecommendationResponseDto getPersonalizedRecommendations(List<MemberHashtag> userHashtags, int limit) {
        log.info("개인화된 추천 시작 - 선호 해시태그 수: {}", userHashtags.size());
        
        // 선호 해시태그 이름 목록 추출
        List<String> hashtagNames = userHashtags.stream()
                .map(mh -> mh.getHashtag().getTagName())
                .collect(Collectors.toList());
        
        // 해시태그 기반 게시글 조회
        Pageable pageable = PageRequest.of(0, limit);
        List<Board> recommendedBoards = boardRepository.findBoardsByHashtags(hashtagNames, pageable);
        
        // DTO 변환
        List<BoardListDto> boardDtos = recommendedBoards.stream()
                .map(this::convertToBoardListDto)
                .collect(Collectors.toList());
        
        return RecommendationResponseDto.builder()
                .recommendationType("personalized")
                .selectedHashtags(hashtagNames)
                .posts(boardDtos)
                .message("선호 해시태그 기반 추천입니다")
                .build();
    }

    /**
     * 인기 해시태그 기반 추천
     */
    private RecommendationResponseDto getPopularHashtagRecommendations(int limit) {
        log.info("인기 해시태그 기반 추천 시작");
        
        // 인기 해시태그 TOP 10 조회
        List<String> popularHashtags = boardRepository.findPopularHashtags(10);
        
        if (popularHashtags.isEmpty()) {
            log.warn("인기 해시태그가 없습니다. 대체 추천을 반환합니다.");
            return getFallbackRecommendations(limit);
        }
        
        // 랜덤으로 3-5개 해시태그 선택
        List<String> selectedHashtags = selectRandomHashtags(popularHashtags, 3, 5);
        
        // 선택된 해시태그로 게시글 조회
        Pageable pageable = PageRequest.of(0, limit);
        List<Board> recommendedBoards = boardRepository.findBoardsByHashtags(selectedHashtags, pageable);
        
        // DTO 변환
        List<BoardListDto> boardDtos = recommendedBoards.stream()
                .map(this::convertToBoardListDto)
                .collect(Collectors.toList());
        
        return RecommendationResponseDto.builder()
                .recommendationType("popular_hashtags")
                .selectedHashtags(selectedHashtags)
                .posts(boardDtos)
                .message("인기 해시태그 기반 추천입니다")
                .build();
    }

    /**
     * 비로그인 사용자를 위한 인기 해시태그 기반 추천
     */
    private RecommendationResponseDto getPopularHashtagRecommendationsForGuest(int limit) {
        log.info("비로그인 사용자를 위한 인기 해시태그 기반 추천 시작");
        
        // 인기 해시태그 TOP 10 조회
        List<String> popularHashtags = boardRepository.findPopularHashtags(10);
        
        if (popularHashtags.isEmpty()) {
            log.warn("인기 해시태그가 없습니다. 대체 추천을 반환합니다.");
            return getFallbackRecommendations(limit);
        }
        
        // 랜덤으로 3-5개 해시태그 선택
        List<String> selectedHashtags = selectRandomHashtags(popularHashtags, 3, 5);
        
        // 선택된 해시태그로 게시글 조회
        Pageable pageable = PageRequest.of(0, limit);
        List<Board> recommendedBoards = boardRepository.findBoardsByHashtags(selectedHashtags, pageable);
        
        // DTO 변환
        List<BoardListDto> boardDtos = recommendedBoards.stream()
                .map(this::convertToBoardListDto)
                .collect(Collectors.toList());
        
        return RecommendationResponseDto.builder()
                .recommendationType("popular_hashtags")
                .selectedHashtags(selectedHashtags)
                .posts(boardDtos)
                .message("인기 해시태그 기반 추천입니다")
                .build();
    }

    /**
     * 대체 추천 (인기글 기반)
     */
    private RecommendationResponseDto getFallbackRecommendations(int limit) {
        log.info("대체 추천 시작");
        
        // 최근 인기 게시글 조회
        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
        Pageable pageable = PageRequest.of(0, limit);
        List<Board> popularBoards = boardRepository.findPopularPostsInLastWeek(weekAgo, pageable);
        
        // DTO 변환
        List<BoardListDto> boardDtos = popularBoards.stream()
                .map(this::convertToBoardListDto)
                .collect(Collectors.toList());
        
        return RecommendationResponseDto.builder()
                .recommendationType("fallback")
                .selectedHashtags(new ArrayList<>())
                .posts(boardDtos)
                .message("인기 게시글 기반 추천입니다")
                .build();
    }

    /**
     * 랜덤 해시태그 선택
     */
    private List<String> selectRandomHashtags(List<String> hashtags, int minCount, int maxCount) {
        if (hashtags.size() <= minCount) {
            return new ArrayList<>(hashtags);
        }
        
        // 랜덤 개수 결정 (minCount ~ maxCount)
        Random random = new Random();
        int count = random.nextInt(maxCount - minCount + 1) + minCount;
        count = Math.min(count, hashtags.size());
        
        // 랜덤 선택
        List<String> shuffled = new ArrayList<>(hashtags);
        Collections.shuffle(shuffled);
        
        return shuffled.subList(0, count);
    }

    /**
     * Board 엔티티를 PopularBoardDto로 변환
     * @param board Board 엔티티
     * @return PopularBoardDto
     */
    private PopularBoardDto convertToPopularBoardDto(Board board) {
        // 게시글의 해시태그 조회
        List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
        
        // 해시태그 DTO 변환
        List<HashtagDto> hashtagDtos = boardHashtags.stream()
                .map(bh -> HashtagDto.fromEntity(bh.getHashtag()))
                .collect(Collectors.toList());
        
        return PopularBoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .author(board.getMember().getMember_NickName()) // Member의 닉네임
                .viewCount(board.getViewCount())
                .likeCount(board.getLikeCount())
                .category(board.getBoardKind().toString()) // BoardKind enum 값
                .createdAt(board.getRegDate()) // BaseTimeEntity의 regDate (실제 필드명)
                .hashtags(hashtagDtos)
                .build();
    }

    /**
     * Board 엔티티를 BoardListDto로 변환
     * @param board Board 엔티티
     * @return BoardListDto
     */
    private BoardListDto convertToBoardListDto(Board board) {
        // 게시글의 해시태그 조회
        List<BoardHashtag> boardHashtags = boardHashtagRepository.findByPostId(board.getId());
        
        // BoardListDto의 정적 메서드 사용
        return BoardListDto.from(board, boardHashtags);
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
