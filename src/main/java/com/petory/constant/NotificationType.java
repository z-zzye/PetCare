package com.petory.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotificationType {
  // 자동예약 취소 알림 (병원이나 관리자가 예약을 취소한 경우)
  AUTOVAXCANCEL("자동예약 취소"),
  
  // 자동예약 완료 알림 (접종이 완료되어 다음 예약이 생성된 경우)
  AUTOCVAXOMPLETE("자동예약 완료"),
  
  // 클린봇 감지 알림 (부적절한 내용이 감지된 경우)
  CLEANBOTDETECTED("부적절한 내용 감지");

  private final String description;
}
