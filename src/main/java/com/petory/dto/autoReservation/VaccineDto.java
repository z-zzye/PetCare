package com.petory.dto.autoReservation;

import com.petory.constant.VaccineType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VaccineDto {
  private String name; // Enum 이름 (예: "DOG_COMPREHENSIVE")
  private String description; // 백신 설명 (예: "강아지 종합백신")

  public static VaccineDto from(VaccineType vaccineType) {
    return new VaccineDto(vaccineType.name(), vaccineType.getDescription());
  }
}
