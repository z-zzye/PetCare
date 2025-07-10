package com.petory.entity.shop;


import com.petory.entity.BaseTimeEntity;
import com.petory.entity.Member;
import com.petory.constant.AuctionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auction_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItem extends BaseTimeEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "auction_item_id")
  private Long id; // 경매식별번호

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id", nullable = false)
  private Item item; // 경매 대상 상품 (1:1 관계)

  @Column(name = "start_price", nullable = false)
  private Integer startPrice; // 경매 시작가 (상품가 기준)

  @Column(name = "start_time", nullable = false)
  private LocalDateTime startTime; // 경매 시작 시간 (경매 등록 시 지정)

  @Column(name = "end_time", nullable = false)
  private LocalDateTime endTime; // 경매 종료 시간

  @Column(name = "bid_unit")
  private Integer bidUnit; // 최소 입찰 단위 (100, 500 등)

  @Enumerated(EnumType.STRING)
  @Column(name = "auction_status", nullable = false)
  private AuctionStatus auctionStatus; // 경매 상태 (예정, 진행, 종료, 취소)

  @Lob
  @Column(name = "auction_description")
  private String auctionDescription; // 관리자 메모/경매 설명 (nullable)
}
