package com.petory.controller;

import com.petory.dto.AmenityDto;
import com.petory.dto.WalkingTrailDetailResponseDto;
import com.petory.dto.WalkingTrailListResponseDto;
import com.petory.service.WalkingTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
   * 산책로 목록을 조회하는 API 입니다.
   * 검색 및 정렬 기능을 포함합니다.
   *
   * @param keyword 검색어 (선택 사항)
   * @param sortBy 정렬 기준 (선택 사항, 예: "recommends", "time")
   * @return 산책로 목록 (List<WalkingTrailListResponseDto>)
   */
  @GetMapping
  public ResponseEntity<List<WalkingTrailListResponseDto>> getTrailList(
    @RequestParam(required = false) String keyword,
    @RequestParam(required = false, defaultValue = "recommends") String sortBy) {

    // TODO: 서비스 레이어에서 keyword와 sortBy 파라미터를 사용하여
    // 검색 및 정렬 로직을 구현해야 합니다.
    List<WalkingTrailListResponseDto> trailList = walkingTrailService.getAllTrails(keyword, sortBy);
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

    // 1. trailId로 산책로 정보를 조회하여 위치 기준점(이름, 주소, 좌표 등)을 얻습니다.
    WalkingTrailDetailResponseDto trail = walkingTrailService.getTrailDetail(trailId);
    String locationQuery = trail.getName(); // 산책로 이름으로 주변을 검색

    // 2. maps_local 도구를 사용하여 주변 편의 시설을 검색합니다.
    // (실제 코드에서는 Maps API 클라이언트를 주입받아 사용하게 됩니다)
    List<AmenityDto> amenities = findAmenitiesWithMapsTool(locationQuery, category);

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
}
