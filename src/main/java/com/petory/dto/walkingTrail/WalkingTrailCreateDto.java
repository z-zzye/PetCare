package com.petory.dto.walkingTrail;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WalkingTrailCreateDto {
  private String name;
  private String description;
  private String pathData;
  private int distance;
  private int time;
  private String mainImage;
}
