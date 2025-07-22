package com.petory.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petory.dto.CommentCreateDto;
import com.petory.dto.walkingTrail.AmenityDto;
import com.petory.dto.walkingTrail.WalkingTrailCreateDto;
import com.petory.dto.walkingTrail.WalkingTrailDetailResponseDto;
import com.petory.dto.walkingTrail.WalkingTrailListResponseDto;
import com.petory.entity.CleanBotLog;
import com.petory.entity.Member;
import com.petory.entity.WalkingTrail;
import com.petory.entity.WalkingTrailComment;
import com.petory.entity.WalkingTrailRecommend;
import com.petory.repository.CleanBotLogRepository;
import com.petory.repository.MemberRepository;
import com.petory.repository.WalkingTrailCommentRepository;
import com.petory.repository.WalkingTrailRecommendRepository;
import com.petory.repository.WalkingTrailRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

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

  /**
   * 산책로 경로를 기준으로 주변 편의시설(카테고리별) 목록을 반환합니다.
   * 1. 경로의 바운딩 박스를 계산해 1차 후보를 넓게 탐색
   * 2. 여러 페이지(최대 3페이지) 반복 호출로 후보를 모두 수집
   * 3. 중복 제거 후, 경로에서 200m 이내만 최종 필터링
   */
  @Override
  public List<AmenityDto> searchAmenitiesNearTrail(Long trailId, String category) {
    // 1. 산책로 경로(pathData) JSON을 파싱하여 경로 지점 리스트 생성
    WalkingTrail trail = walkingTrailRepository.findById(trailId)
        .orElseThrow(() -> new EntityNotFoundException("해당 산책로 없음"));
    String pathData = trail.getPathData();
    ObjectMapper objectMapper = new ObjectMapper();
    List<Map<String, Object>> coordinates;
    try {
        coordinates = objectMapper.readValue(pathData, new TypeReference<List<Map<String, Object>>>() {});
    } catch (Exception e) {
        return List.of();
    }
    // 2. 각 지점의 위도/경도에서 바운딩 박스(최소/최대 위경도) 계산
    List<Point> pathPoints = coordinates.stream()
        .map(coord -> new Point((double)coord.get("lat"), (double)coord.get("lng")))
        .collect(Collectors.toList());
    double minLat = pathPoints.stream().mapToDouble(p -> p.lat).min().orElse(0);
    double maxLat = pathPoints.stream().mapToDouble(p -> p.lat).max().orElse(0);
    double minLng = pathPoints.stream().mapToDouble(p -> p.lng).min().orElse(0);
    double maxLng = pathPoints.stream().mapToDouble(p -> p.lng).max().orElse(0);

    // 3. 바운딩 박스에 threshold(200m)만큼 여유(버퍼)를 더해 탐색 범위 확장
    double threshold = 200.0;
    double latBuffer = threshold / 111000.0; // 위도 1도 ≈ 111km
    double avgLat = (minLat + maxLat) / 2.0;
    double lngBuffer = threshold / (111000.0 * Math.cos(Math.toRadians(avgLat))); // 경도 1도 환산

    double searchMinLat = minLat - latBuffer;
    double searchMaxLat = maxLat + latBuffer;
    double searchMinLng = minLng - lngBuffer;
    double searchMaxLng = maxLng + lngBuffer;

    // 4. 카카오맵 API를 최대 3페이지(15개씩) 반복 호출하여 후보 편의시설 모두 수집
    List<AmenityDto> allAmenities = new java.util.ArrayList<>();
    int maxPage = 3;
    for (int page = 1; page <= maxPage; page++) {
        // 각 페이지별로 API 호출
        List<AmenityDto> pageAmenities = kakaoMapService.searchInBounds
              (category, searchMinLat, searchMaxLat, searchMinLng, searchMaxLng, page);
        if (pageAmenities == null || pageAmenities.isEmpty()) break;
        allAmenities.addAll(pageAmenities);
        if (pageAmenities.size() < 15) break; // 마지막 페이지 도달 시 중단
    }
    // 5. 장소명+주소 기준으로 중복 편의시설 제거
    java.util.Set<String> seen = new java.util.HashSet<>();
    List<AmenityDto> uniqueAmenities = new java.util.ArrayList<>();
    for (AmenityDto dto : allAmenities) {
        String key = dto.getName() + ":" + dto.getAddress();
        if (!seen.contains(key)) {
            seen.add(key);
            uniqueAmenities.add(dto);
        }
    }
    // 6. 경로의 각 지점과 편의시설 간의 거리를 계산하여 200m 이내만 필터링
    double thresholdDistance = 200.0;
    List<AmenityDto> filtered = uniqueAmenities.stream()
        .filter(amenity -> pathPoints.stream()
            .anyMatch(p -> distance(p.lat, p.lng, amenity.getLat(), amenity.getLng()) < thresholdDistance))
        .collect(Collectors.toList());

    // 7. 최종 결과 반환
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
