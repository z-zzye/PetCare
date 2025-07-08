package com.petory.controller;

import com.petory.dto.*;
import com.petory.dto.walkingTrail.AmenityDto;
import com.petory.dto.walkingTrail.WalkingTrailCreateDto;
import com.petory.dto.walkingTrail.WalkingTrailDetailResponseDto;
import com.petory.dto.walkingTrail.WalkingTrailListResponseDto;
import com.petory.service.WalkingTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 산책로 관련 API 요청을 처리하는 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/trails")
@RequiredArgsConstructor
public class WalkingTrailController {

  private final WalkingTrailService walkingTrailService;

  /**
   * 새로운 산책로를 생성하는 API 입니다.
   * @param createDto 프론트엔드에서 보낸 산책로 생성 데이터 (JSON)
   * @return 생성된 산책로의 ID
   */
  @PostMapping
  public ResponseEntity<Long> createTrail(@RequestBody WalkingTrailCreateDto createDto) {
    Long savedTrailId = walkingTrailService.createTrail(createDto);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedTrailId);
  }

  /**
   * 산책로 목록을 조회하는 API 입니다.
   * 검색 및 정렬 기능을 포함합니다.
   *
   * @param keyword 검색어 (선택 사항)
   * @param minTime 최소 시간 (선택 사항, 초 단위)
   * @param maxTime 최대 시간 (선택 사항, 초 단위)
   * @param minDistance 최소 거리 (선택 사항, 미터 단위)
   * @param maxDistance 최대 거리 (선택 사항, 미터 단위)
   * @param sortBy 정렬 기준 (선택 사항, 예: "recommends", "time")
   * @return 산책로 목록 (List<WalkingTrailListResponseDto>)
   */
  @GetMapping
  public ResponseEntity<List<WalkingTrailListResponseDto>> getTrailList(
    @RequestParam(required = false) String keyword,
    @RequestParam(required = false) Integer minTime,
    @RequestParam(required = false) Integer maxTime,
    @RequestParam(required = false) Integer minDistance,
    @RequestParam(required = false) Integer maxDistance,
    @RequestParam(required = false, defaultValue = "regDate") String sortBy) {

    List<WalkingTrailListResponseDto> trailList = walkingTrailService.getAllTrails(
      keyword, minTime, maxTime, minDistance, maxDistance, sortBy
    );
    return ResponseEntity.ok(trailList);
  }

  /**
   * 특정 산책로의 상세 정보를 조회하는 API 입니다.
   *
   * @param trailId 조회할 산책로의 ID
   * @return 산책로 상세 정보 (WalkingTrailDetailResponseDto)
   */
  @GetMapping("/{trailId}")
  public ResponseEntity<WalkingTrailDetailResponseDto> getTrailDetail(@PathVariable Long trailId) {
    WalkingTrailDetailResponseDto trailDetail = walkingTrailService.getTrailDetail(trailId);
    return ResponseEntity.ok(trailDetail);
  }

  /**
   * 특정 산책로 주변의 편의 시설 목록을 조회하는 API 입니다.
   *
   * @param trailId 기준이 될 산책로의 ID
   * @param category 조회할 편의 시설 카테고리 (예: "편의점", "카페", "공중화장실")
   * @return 주변 편의 시설 목록 (List<AmenityDto>)
   */
  @GetMapping("/{trailId}/amenities")
  public ResponseEntity<List<AmenityDto>> getNearbyAmenities(
    @PathVariable Long trailId,
    @RequestParam String category) {
    List<AmenityDto> amenities = walkingTrailService.searchAmenitiesNearTrail(trailId, category);
    return ResponseEntity.ok(amenities);
  }

  /**
   * [예시] maps_local 도구를 호출하는 로직을 나타내는 메서드입니다.
   * 실제 구현 시에는 별도의 서비스나 헬퍼 클래스로 분리하는 것이 좋습니다.
   */
  private List<AmenityDto> findAmenitiesWithMapsTool(String location, String category) {
    // 이 부분에서 maps_local.Google Maps 와 같은 도구를 호출하게 됩니다.
    // print(maps_local.Google Maps(query=category, location_bias=location, rank_preference='distance'))
    // 호출 결과를 AmenityDto 목록으로 변환하여 반환합니다.

    // 아래는 임시 더미 데이터입니다.
    if ("편의점".equals(category)) {
      return List.of(
        new AmenityDto("GS25 인천공원점", "인천광역시 중구 공원로 123", "150m", "http://place.map.kakao.com/1"),
        new AmenityDto("CU 인천산책로점", "인천광역시 중구 산책로 45", "300m", "http://place.map.kakao.com/2")
      );
    } else if ("카페".equals(category)) {
      return List.of(
        new AmenityDto("스타벅스 인천점", "인천광역시 중구 큰길 77", "200m", "http://place.map.kakao.com/3")
      );
    }
    return List.of(); // 결과가 없으면 빈 리스트 반환
  }

  /**
   * 특정 산책로에 새로운 댓글을 작성합니다.
   */
  @PostMapping("/{trailId}/comments")
  public ResponseEntity<?> addComment(
          @PathVariable Long trailId,
          @RequestBody CommentCreateDto createDto,
          @AuthenticationPrincipal UserDetails userDetails) {

    if (userDetails == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("댓글을 작성하려면 로그인이 필요합니다.");
    }
    String userEmail = userDetails.getUsername();

    Long savedCommentId = walkingTrailService.addCommentToTrail(trailId, createDto, userEmail);

    return ResponseEntity.status(HttpStatus.CREATED).body(savedCommentId);
  }

  @PostMapping("/{trailId}/recommend")
  public ResponseEntity<?> recommendTrail(@PathVariable Long trailId, @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("추천하려면 로그인이 필요합니다.");
    }
    String userEmail = userDetails.getUsername();
    try {
      walkingTrailService.addRecommendation(trailId, userEmail);
      return ResponseEntity.ok().build();
    } catch (IllegalStateException e) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }
  }
}
