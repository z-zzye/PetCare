package com.petory.constant;

import lombok.Getter;

@Getter
public enum VaccineType {

  // --- 고양이 백신 ---
  CAT_COMPREHENSIVE("고양이 종합백신", PetCategory.CAT, 6, 3, 3),
  CAT_LEUKEMIA("고양이 백혈병", PetCategory.CAT, 8, 2, 3),
  CAT_RABIES("고양이 광견병", PetCategory.CAT, 12, 1, 0), // 3개월 -> 12주
  CAT_ANTIBODY_TEST("고양이 항체검사", PetCategory.CAT, 16, 1, 0), // 4개월 -> 16주

  // --- 강아지 백신 ---
  DOG_COMPREHENSIVE("강아지 종합백신", PetCategory.DOG, 6, 5, 3),
  DOG_RABIES("강아지 광견병", PetCategory.DOG, 16, 1, 0), // 4개월 -> 16주
  DOG_ANTIBODY_TEST("강아지 항체검사", PetCategory.DOG, 16, 1, 0); // 4개월 -> 16주

  private final String description;       // 백신 설명
  private final PetCategory petCategory;  // 적용 가능한 동물 종류
  private final int startWeeks;           // 접종 시작 주차 (생후)
  private final int totalShots;           // 총 접종 횟수
  private final int intervalWeeks;        // 접종 간격 (주)

  VaccineType(String description, PetCategory petCategory, int startWeeks, int totalShots, int intervalWeeks) {
    this.description = description;
    this.petCategory = petCategory;
    this.startWeeks = startWeeks;
    this.totalShots = totalShots;
    this.intervalWeeks = intervalWeeks;
  }
}
