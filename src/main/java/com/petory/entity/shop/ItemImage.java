package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Table(name = "item_image")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemImage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long itemImageId; //이미지 식별번호

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id", nullable = false)
  private Item item; // 상품 연관관계 (N:1)

  @Column(nullable = false)
  private String itemImageUrl; // 이미지 경로

  @Column(name = "is_rep", nullable = false)
  private Boolean isRepresentative; // 대표 이미지 여부
}
