package com.petory.dto.autoReservation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotResponseDto {

  private String hospitalId;
  private String hospitalName;
  private String targetDate; // "YYYY-MM-DD"
  private String timeSlot; // "MORNING", "AFTERNOON", "EVENING"
  private Double distance;
  private String address;
  private String phone;

}
