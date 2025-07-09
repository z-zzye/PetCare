package com.petory.dto.autoReservation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VaccineDateInfo {
  private String vaccineName;        // 기존 VaccineDto의 'name'
  private String vaccineDescription; // 기존 VaccineDto의 'description'
  private LocalDate date;            // << 새로 추가된 날짜 필드
}
