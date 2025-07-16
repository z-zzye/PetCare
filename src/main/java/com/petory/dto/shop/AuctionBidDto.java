package com.petory.dto.shop;

import com.petory.constant.AuctionBidStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionBidDto {
    
    private Long bidId; // 입찰 ID
    
    private Long auctionItemId; // 경매 상품 ID
    private String auctionItemName; // 경매 상품명
    
    private Long memberId; // 입찰자 ID
    private String memberNickname; // 입찰자 닉네임
    
    private Integer bidAmount; // 입찰 금액
    private LocalDateTime bidTime; // 입찰 시간
    
    // 추가 정보
    private boolean isHighest; // 현재 최고가인지
    private AuctionBidStatus status; // 입찰 상태
} 