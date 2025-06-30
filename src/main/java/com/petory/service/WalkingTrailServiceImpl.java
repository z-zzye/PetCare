package com.petory.service;

import com.petory.dto.*;
import com.petory.entity.*;
import com.petory.repository.CleanBotLogRepository;
import com.petory.repository.MemberRepository;
import com.petory.repository.WalkingTrailCommentRepository;
import com.petory.repository.WalkingTrailRepository;
import com.petory.repository.WalkingTrailRecommendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성 (의존성 주입)
@Transactional(readOnly = true) // 클래스 전체에 읽기 전용 트랜잭션 적용 (성능 최적화)
public class WalkingTrailServiceImpl implements WalkingTrailService {

  private final WalkingTrailRepository walkingTrailRepository;
  private final WalkingTrailCommentRepository walkingTrailCommentRepository;
  private final MemberRepository memberRepository; // 사용자 정보를 가져오기 위함
  private final CleanBotService cleanBotService; // CleanBotService 주입
  private final CleanBotLogRepository cleanBotLogRepository;
  private final KakaoMapService kakaoMapService;
  private final WalkingTrailRecommendRepository walkingTrailRecommendRepository;

  @Override
  @Transactional // 쓰기 작업이므로 readOnly=false 트랜잭션 적용
  public Long createTrail(WalkingTrailCreateDto createDto) {
    // DTO를 엔티티로 변환
    WalkingTrail newTrail = new WalkingTrail();
    newTrail.setName(createDto.getName());
    newTrail.setDescription(createDto.getDescription());
    newTrail.setPathData(createDto.getPathData());
    newTrail.setDistance(createDto.getDistance());
    newTrail.setTime(createDto.getTime());
    newTrail.setMainImage(createDto.getMainImage());

    // 리포지토리를 통해 저장
    WalkingTrail savedTrail = walkingTrailRepository.save(newTrail);
    return savedTrail.getId();
  }

  @Override
  public List<WalkingTrailListResponseDto> getAllTrails(String keyword, Integer minTime, Integer maxTime, Integer minDistance, Integer maxDistance, String sortBy) {
    // 정렬 기준
    Sort sort = Sort.by(Sort.Direction.DESC, sortBy);

    // 검색 파라미터 기본값 처리
    String searchKeyword = (keyword != null) ? keyword : "";
    int searchMinTime = (minTime != null) ? minTime : 0;
    int searchMaxTime = (maxTime != null) ? maxTime : Integer.MAX_VALUE;
    int searchMinDistance = (minDistance != null) ? minDistance : 0;
    int searchMaxDistance = (maxDistance != null) ? maxDistance : Integer.MAX_VALUE;

    List<WalkingTrail> trails = walkingTrailRepository.findByNameContainingAndTimeBetweenAndDistanceBetween(
      searchKeyword, searchMinTime, searchMaxTime, searchMinDistance, searchMaxDistance, sort
    );

    return trails.stream()
      .map(WalkingTrailListResponseDto::from)
      .collect(Collectors.toList());
  }

  @Override
  // @Transactional // 조회수(views)를 사용하게 된다면 활성화
  public WalkingTrailDetailResponseDto getTrailDetail(Long trailId) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));

    return WalkingTrailDetailResponseDto.from(trail);
  }

  @Override
  @Transactional
  public void addRecommendation(Long trailId, String userEmail) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));
    Member member = memberRepository.findByMember_Email(userEmail)
      .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + userEmail));

    // 중복 추천 방지
    if (walkingTrailRecommendRepository.existsByWalkingTrailAndMember(trail, member)) {
      throw new IllegalStateException("이미 추천하셨습니다.");
    }

    WalkingTrailRecommend recommend = new WalkingTrailRecommend();
    recommend.setWalkingTrail(trail);
    recommend.setMember(member);
    walkingTrailRecommendRepository.save(recommend);

    trail.setRecommends(trail.getRecommends() + 1);
  }

  @Override
  @Transactional
  public Long addCommentToTrail(Long trailId, CommentCreateDto commentCreateDto, String userEmail) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
            .orElseThrow(() -> new EntityNotFoundException("해당 ID의 산책로를 찾을 수 없습니다: " + trailId));
    Member member = memberRepository.findByMember_Email(userEmail)
            .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + userEmail));

    String originalContent = commentCreateDto.getContent();
    WalkingTrailComment newComment = new WalkingTrailComment();

    // 1. 클린봇으로 비속어 검사 실행
    if (cleanBotService.containsProfanity(originalContent)) {
      // 비속어 포함 시: 블라인드 처리
      newComment.setBlinded(true);
      newComment.setOriginalContent(originalContent);
      newComment.setContent(cleanBotService.filter(originalContent)); // 필터링된 메시지로 내용 설정
    } else {
      // 정상 댓글
      newComment.setBlinded(false);
      newComment.setContent(originalContent);
    }

    newComment.setWalkingTrail(trail);
    newComment.setMember(member);

    // 2. 댓글을 먼저 저장하여 ID 할당
    WalkingTrailComment savedComment = walkingTrailCommentRepository.save(newComment);

    // 3. 비속어가 감지되었다면, 로그 기록
    if (savedComment.isBlinded()) {
      CleanBotLog log = new CleanBotLog();
      log.setTargetId(savedComment.getId());
      log.setTargetType("WALKING_TRAIL_COMMENT");
      log.setOriginalContent(savedComment.getOriginalContent());
      cleanBotLogRepository.save(log);
    }

    return savedComment.getId();
  }

  @Override
  @Transactional
  public void deleteComment(Long commentId, String userEmail) {
    WalkingTrailComment comment = walkingTrailCommentRepository.findById(commentId)
      .orElseThrow(() -> new EntityNotFoundException("해당 ID의 댓글을 찾을 수 없습니다: " + commentId));

    // 본인 확인 로직
    if (!comment.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("댓글을 삭제할 권한이 없습니다.");
    }

    walkingTrailCommentRepository.delete(comment);
  }

  @Override
  public List<AmenityDto> searchAmenitiesNearTrail(Long trailId, String category) {
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
        .orElseThrow(() -> new EntityNotFoundException("해당 산책로 없음"));
    String pathData = trail.getPathData();
    ObjectMapper objectMapper = new ObjectMapper();
    // 1. 경로 파싱 및 바운딩 박스 계산
    List<Map<String, Object>> coordinates;
    try {
        coordinates = objectMapper.readValue(pathData, new TypeReference<List<Map<String, Object>>>() {});
    } catch (Exception e) {
        return List.of();
    }
    List<Point> pathPoints = coordinates.stream()
        .map(coord -> new Point((double)coord.get("lat"), (double)coord.get("lng")))
        .collect(Collectors.toList());
    double minLat = pathPoints.stream().mapToDouble(p -> p.lat).min().orElse(0);
    double maxLat = pathPoints.stream().mapToDouble(p -> p.lat).max().orElse(0);
    double minLng = pathPoints.stream().mapToDouble(p -> p.lng).min().orElse(0);
    double maxLng = pathPoints.stream().mapToDouble(p -> p.lng).max().orElse(0);

    // 2. 바운딩 박스 내 편의시설 1차 검색 (kakaoMapService.searchInBounds 등으로 위임)
    List<AmenityDto> allAmenities = kakaoMapService.searchInBounds(category, minLat, maxLat, minLng, maxLng);

    // 3. 경로 근접 필터링
    double threshold = 500.0;
    List<AmenityDto> filtered = allAmenities.stream()
        .filter(amenity -> pathPoints.stream()
            .anyMatch(p -> distance(p.lat, p.lng, amenity.getLat(), amenity.getLng()) < threshold))
        .collect(Collectors.toList());

    return filtered;
  }

  private static class Point {
    double lat, lng;
    Point(double lat, double lng) { this.lat = lat; this.lng = lng; }
  }

  private double distance(double lat1, double lng1, double lat2, double lng2) {
    double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
               Math.sin(dLng/2) * Math.sin(dLng/2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
