package com.petory.dto.autoReservation;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ReservationConfirmRequestDto {

  private Long petId; // 예약 대상 펫
  private String hospitalId; // 최종 선택한 병원
  private String hospitalAddress; // 최종 선택한 병원의 주소
  private String hospitalPhone; // 최종 선택한 병원의 전화번호
  private String targetDate; // 최종 선택한 날짜
  private String timeSlot; // 최종 선택한 시간대
  private List<String> vaccineTypes; // 이 예약에서 접종할 백신 목록
  private Integer totalAmount; //  총 접종비

}
