package com.petory.dto.autoReservation;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AlternativeDateOptionDto {
    private LocalDate date;
    private List<AvailableSlotResponseDto> availableSlots;
    private String reason; // "가장 빠른 날짜", "선호 요일", "가격 최적화", "거리 최적화" 등
    private int totalPrice;
    private double averageDistance;
    private int hospitalCount;

    public AlternativeDateOptionDto(LocalDate date, List<AvailableSlotResponseDto> availableSlots, String reason) {
        this.date = date;
        this.availableSlots = availableSlots;
        this.reason = reason;
        this.totalPrice = availableSlots.stream()
                .mapToInt(slot -> slot.getPriceList().values().stream().mapToInt(Integer::intValue).sum())
                .min()
                .orElse(0);
        this.averageDistance = availableSlots.stream()
                .mapToDouble(AvailableSlotResponseDto::getDistance)
                .average()
                .orElse(0.0);
        this.hospitalCount = availableSlots.size();
    }
}
