package com.petory.dto;

import com.petory.entity.WalkingTrail;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WalkingTrailListResponseDto {
  private Long id;
  private String name;
  private String mainImage;
  private int distance;
  private int time;
  private int views;
  private int recommends;

  // 엔티티를 DTO로 변환하는 정적 팩토리 메서드 (서비스 로직에서 사용)
  public static WalkingTrailListResponseDto from(WalkingTrail walkingTrail) {
    WalkingTrailListResponseDto dto = new WalkingTrailListResponseDto();
    dto.setId(walkingTrail.getId());
    dto.setName(walkingTrail.getName());
    dto.setMainImage(walkingTrail.getMainImage());
    dto.setDistance(walkingTrail.getDistance());
    dto.setTime(walkingTrail.getTime());
    dto.setViews(walkingTrail.getViews());
    dto.setRecommends(walkingTrail.getRecommends());
    return dto;
  }
}
