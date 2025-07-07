package com.petory.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AutoReservationRequestDto {

  private Long petId;
  private LocationDto location;
  private String preferredTime; // "MORNING", "AFTERNOON", "EVENING"

  @Getter
  @Setter
  public static class LocationDto {
    private double lat; // 위도
    private double lng; // 경도
  }
}
