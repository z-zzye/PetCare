package com.petory.entity.shop;


import com.petory.entity.Member;
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
public class AuctionItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "auction_item_id")
  private Long id; // 경매식별번호

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id", nullable = false)
  private Item item; // 경매 대상 상품 (1:1 관계)

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id")
  private Member currentWinner; // 최고 입찰자 (nullable)

  @Column(name = "start_price", nullable = false)
  private Integer startPrice; // 경매 시작가 (상품가 기준)

  @Column(name = "start_time", nullable = false)
  private LocalDateTime startTime; // 경매 시작 시간 (경매 등록 시 지정)

  @Column(name = "end_time", nullable = false)
  private LocalDateTime endTime; // 경매 종료 시간

  @Column(name = "current_price")
  private Integer currentPrice; // 현재 최고 입찰가

  @Column(name = "bid_unit")
  private Integer bidUnit; // 최소 입찰 단위 (100, 500 등)

  @Column(name = "started", nullable = false)
  private boolean started; // 경매 시작 여부

  @Column(name = "ended", nullable = false)
  private boolean ended; // 경매 종료 여부
}
