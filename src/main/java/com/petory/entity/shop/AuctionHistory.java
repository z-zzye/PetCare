package com.petory.entity.shop;

import com.petory.entity.Member;
import com.petory.entity.BaseTimeEntity;
import com.petory.constant.AuctionWinStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "auction_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionHistory extends BaseTimeEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "auction_history_id")
  private Long id; // 경매히스토리식별번호

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "auction_item_id", nullable = false)
  private AuctionItem auctionItem; // 참여한 경매

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member; // 참여한 회원

  @Column(name = "my_highest_bid", nullable = false)
  private Integer myHighestBid; // 내가 입찰한 최고 금액

  @Column(name = "is_winner", nullable = false)
  private boolean isWinner; // 낙찰 여부

  @Column(name = "total_bids")
  private Integer totalBids; // 총 입찰 횟수

  @Column(name = "final_price")
  private Integer finalPrice; // 최종 낙찰가

  @Enumerated(EnumType.STRING)
  @Column(name = "auction_win_status")
  private AuctionWinStatus auctionWinStatus; // 낙찰 상태(WIN, DELIVERED, CANCELLED 등)
}
