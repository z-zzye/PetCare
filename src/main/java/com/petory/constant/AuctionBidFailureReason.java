package com.petory.constant;

/**
 * 경매 입찰 실패 사유
 */
public enum AuctionBidFailureReason {
    
    OUTBID("다른 사람이 더 높게 입찰"),
    INVALID_AMOUNT("유효하지 않은 입찰가"),
    AUCTION_ENDED("경매가 종료됨"),
    DUPLICATE_BID("동일 금액으로 다른 사용자가 먼저 입찰"),
    INSUFFICIENT_FUNDS("잔액 부족"),
    NOT_ACTIVE("진행 중인 경매가 아님"),
    UNKNOWN("알 수 없는 오류");
    
    private final String description;
    
    AuctionBidFailureReason(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 