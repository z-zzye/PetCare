package com.petory.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class PaymentMethod extends BaseTimeEntity { // BaseTimeEntity 상속으로 생성/수정일 자동 관리

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  // PG사(아임포트 등)에서 발급하는 빌링 키 (고객 식별 및 결제용)
  @Column(nullable = false, unique = true)
  private String billingKey;

  // 사용자에게 보여줄 카드 정보 (예: "카카오뱅크 체크카드 (1234)")
  private String cardInfo;

  // 기본 결제 수단 여부
  private boolean isDefault;

  @Builder
  public PaymentMethod(Member member, String billingKey, String cardInfo, boolean isDefault) {
    this.member = member;
    this.billingKey = billingKey;
    this.cardInfo = cardInfo;
    this.isDefault = isDefault;
  }
}
