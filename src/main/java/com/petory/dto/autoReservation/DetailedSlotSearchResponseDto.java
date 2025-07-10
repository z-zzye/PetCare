package com.petory.dto.autoReservation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DetailedSlotSearchResponseDto {
  // 1. 백신별 가장 빠른 예약 가능일 목록
  private List<VaccineDateInfo> vaccineDates;

  // 2. 전체 중 가장 빠른 날짜에 예약 가능한 병원 목록
  private List<AvailableSlotResponseDto> availableSlots;
}
