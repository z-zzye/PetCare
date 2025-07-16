package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Table(name = "item_category")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemCategory {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long categoryId; // 카테고리 식별번호 (PK)

  @Column
  private Long parentOption; // 상위 카테고리 ID (계층형 구조용)

  @Column(nullable = false)
  private String optionValue; // 카테고리명
}
