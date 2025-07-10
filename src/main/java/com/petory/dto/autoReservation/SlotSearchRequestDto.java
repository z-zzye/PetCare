package com.petory.dto.autoReservation;

import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.util.List;

@Getter
@Setter
public class SlotSearchRequestDto {

  private Long petId; // 접종 기록 조회를 위한 펫 ID
  private LocationDto location; // 사용자 위치
  private double radius; // 탐색 반경 (km)
  private List<String> vaccineTypes; // 사용자가 선택한 접종할 백신 목록 (Enum 이름)
  private String preferredTime; // 선호 시간대 ("MORNING", "AFTERNOON", "EVENING")
  private List<DayOfWeek> preferredDays; // "MONDAY", "TUESDAY" 등

  @Getter
  @Setter
  public static class LocationDto {
    private double lat;
    private double lng;
  }
}
