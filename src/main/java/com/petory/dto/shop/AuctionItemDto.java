package com.petory.dto.shop;

import jakarta.validation.constraints.*;
import lombok.*;
import com.petory.constant.AuctionStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItemDto {
  
  @NotNull(message = "상품 ID는 필수입니다.")
  private Long item_id;

  @NotNull(message = "시작가는 필수입니다.")
  @Min(value = 0, message = "시작가는 0원 이상이어야 합니다.")
  private Integer start_price;

  @NotNull(message = "경매 시작 시간은 필수입니다.")
  private LocalDateTime start_time;

  @NotNull(message = "경매 종료 시간은 필수입니다.")
  private LocalDateTime end_time;

  @NotNull(message = "최소 입찰 단위는 필수입니다.")
  @Min(value = 1, message = "최소 입찰 단위는 1원 이상이어야 합니다.")
  private Integer bid_unit;

  private String auction_description;

  private AuctionStatus auction_status;
} 