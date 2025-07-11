package com.petory.dto.autoReservation;

import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class PetAutoVaxSettingsDto {
  private List<String> managedVaccineTypes; // 접종받을 백신
  private String preferredHospitalId; // 선호 병원 ID
  private Set<DayOfWeek> preferredDays; // 선호 요일
  private String preferredTime; // 선호 시간대
}
