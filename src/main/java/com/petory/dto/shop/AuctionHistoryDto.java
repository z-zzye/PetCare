package com.petory.dto.shop;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionHistoryDto {
    
    private Long historyId; // 히스토리 ID
    
    private Long auctionItemId; // 경매 상품 ID
    private String auctionItemName; // 경매 상품명
    private String auctionItemImage; // 경매 상품 이미지
    
    private Integer myHighestBid; // 내가 입찰한 최고 금액
    private boolean isWinner; // 낙찰 여부
    
    // 경매 결과 정보
    private Integer finalPrice; // 최종 낙찰가
    // winnerNickname 필드 제거
    
    // 시간 정보
    private LocalDateTime createdAt; // 히스토리 생성 시간
    private LocalDateTime auctionEndTime; // 경매 종료 시간
    
    // 결과 메시지
    private String resultMessage; // 결과 메시지 (낙찰 성공, 실패 등)

    private String deliveryAddress; // 배송지 입력값
    private LocalDateTime deliveryInputAt; // 배송지 입력 시각
    private LocalDateTime deliveryDeadline; // 배송지 입력 마감 시각
    private com.petory.constant.AuctionWinStatus auctionWinStatus; // 낙찰 상태(WIN, DELIVERED, CANCELLED 등)
} 