package com.petory.dto.autoReservation;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DetailedSlotSearchResponseDto {
    private List<VaccineDateInfo> vaccineDates;
    private List<AvailableSlotResponseDto> availableSlots;
    private List<AlternativeDateOptionDto> alternativeDates; // 새로운 필드 추가

    public DetailedSlotSearchResponseDto(List<VaccineDateInfo> vaccineDates, List<AvailableSlotResponseDto> availableSlots) {
        this.vaccineDates = vaccineDates;
        this.availableSlots = availableSlots;
        this.alternativeDates = null; // 기존 생성자 호환성 유지
    }
}
