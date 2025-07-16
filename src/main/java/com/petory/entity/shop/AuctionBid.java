package com.petory.entity.shop;

import com.petory.entity.Member;
import com.petory.constant.AuctionBidStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_bid")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionBid {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "auction_bid_id")
  private Long id; // 입찰내역식별번호

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "auction_item_id", nullable = false)
  private AuctionItem auctionItem; // 어떤 경매에 입찰했는지

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member; // 입찰한 회원

  @Column(name = "bid_amount", nullable = false)
  private Integer bidAmount; // 입찰 금액

  @Column(name = "bid_time", nullable = false)
  private LocalDateTime bidTime; // 입찰 시간

  @Enumerated(EnumType.STRING)
  @Column(name = "bid_status", nullable = false)
  private AuctionBidStatus bidStatus = AuctionBidStatus.SUCCESS; // 입찰 상태 (기본값: SUCCESS)
}
