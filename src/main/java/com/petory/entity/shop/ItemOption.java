package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Table(name= "items_option")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemOption {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long optionId; // 상품옵션식별번호 (PK)

  @ManyToOne(fetch = FetchType.LAZY) //데이터를 언제 로딩? 나중에(DB접근 시점에) 로딩
  @JoinColumn(name = "item_id", nullable = false)
  private Item item; // 상품식별번호 (FK → items.item_id)

  @Column(nullable = false)
  private String optionName; // 옵션명 (예: 사이즈, 색상 등)

  private Integer optionAddPrice; // 추가금액 (nullable)

  @Column(nullable = false)
  private Integer optionStock; // 재고수량
}
