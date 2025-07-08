package com.petory.dto.shop;

import lombok.*;
import com.petory.constant.AuctionStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItemResponseDto {
  
  private Long auction_item_id;
  private Long item_id;
  private String itemName;
  private Integer itemPrice;
  private String thumbnailUrl;
  
  private Integer start_price;
  private LocalDateTime start_time;
  private LocalDateTime end_time;
  private Integer current_price;
  private Integer bid_unit;
  private AuctionStatus auction_status;
  private String auction_description;
  
  // 입찰자 정보 (선택적)
  private String currentWinnerName;
  private Long currentWinnerId;
} 