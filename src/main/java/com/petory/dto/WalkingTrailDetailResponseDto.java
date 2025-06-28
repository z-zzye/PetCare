package com.petory.dto;

import com.petory.entity.WalkingTrail;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class WalkingTrailDetailResponseDto {
  private Long id;
  private String name;
  private String description;
  private String pathData;
  private int distance;
  private int time;
  private String mainImage;
  private int views;
  private int recommends;
  private List<CommentDto> comments;

  // 엔티티를 DTO로 변환하는 정적 팩토리 메서드
  public static WalkingTrailDetailResponseDto from(WalkingTrail walkingTrail) {
    WalkingTrailDetailResponseDto dto = new WalkingTrailDetailResponseDto();
    dto.setId(walkingTrail.getId());
    dto.setName(walkingTrail.getName());
    dto.setDescription(walkingTrail.getDescription());
    dto.setPathData(walkingTrail.getPathData());
    dto.setDistance(walkingTrail.getDistance());
    dto.setTime(walkingTrail.getTime());
    dto.setMainImage(walkingTrail.getMainImage());
    dto.setViews(walkingTrail.getViews());
    dto.setRecommends(walkingTrail.getRecommends());

    dto.setComments(walkingTrail.getComments().stream()
      .map(CommentDto::from) // 메서드 레퍼런스로 깔끔하게 처리
      .collect(Collectors.toList()));

    return dto;
  }
}
