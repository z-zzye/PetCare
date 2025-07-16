package com.petory.dto.autoReservation; // 패키지 경로는 실제 프로젝트에 맞게 수정하세요.

import com.petory.constant.VaccineType;
import com.petory.entity.Pet;
import com.petory.entity.Reservation; //
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
public class ReservationDetailDto {

  // 1. 예약 기본 정보
  private Long reservationId;
  private String vaccineDescription;
  private LocalDateTime reservationDateTime;

  // 2. 예약 펫 정보
  private Long petId;
  private String petName;
  private String petImageUrl;

  // 3. 예약 병원 정보
  private String hospitalName;
  private String hospitalAddress;
  private String hospitalPhone;

  // 4. 상태 및 액션 정보
  private String reservationStatus;
  private LocalDateTime paymentDueDate;

  // 5. 금액 정보
  private Integer deposit;
  private Integer balance;
  private Integer totalAmount;

  /**
   * Reservation 엔티티를 ReservationDetailDto로 변환하는 생성자
   * @param reservation DB에서 조회한 Reservation 엔티티 객체
   */
  public ReservationDetailDto(Reservation reservation) {
    this.reservationId = reservation.getId();
    this.reservationDateTime = reservation.getReservationDateTime();
    if (reservation.getVaccineTypes() != null && !reservation.getVaccineTypes().isEmpty()) {
      this.vaccineDescription = convertVaccineNamesToDescriptions(reservation.getVaccineTypes());
    }
    Pet pet = reservation.getPet();
    this.petId = pet.getPet_Num();
    this.petName = pet.getPet_Name();
    this.petImageUrl = pet.getPet_ProfileImg();
    this.hospitalName = reservation.getHospitalName();
    this.hospitalAddress = reservation.getHospitalAddress();
    this.hospitalPhone = reservation.getHospitalPhone();
    this.reservationStatus = reservation.getReservationStatus().name();
    this.paymentDueDate = reservation.getPaymentDueDate();

    // ✅ [핵심] 엔티티에 저장된 금액 정보로 DTO 필드 설정
    this.totalAmount = reservation.getTotalAmount();
    this.deposit = reservation.getDeposit();
    // ✅ 잔금은 총액과 예약금의 차이로 계산
    if (this.totalAmount != null && this.deposit != null) {
      this.balance = this.totalAmount - this.deposit;
    } else {
      this.balance = 0;
    }
  }

  private String convertVaccineNamesToDescriptions(String vaccineNames) {
    return Arrays.stream(vaccineNames.split(",")) // 쉼표로 분리
      .map(String::trim) // 공백 제거
      .map(name -> {
        try {
          return VaccineType.valueOf(name).getDescription(); // Enum에서 설명 찾아오기
        } catch (IllegalArgumentException e) {
          return name; // Enum에 없는 이름이면 원래 이름 그대로 반환
        }
      })
      .collect(Collectors.joining(", ")); // 다시 쉼표와 공백으로 연결
  }
}
