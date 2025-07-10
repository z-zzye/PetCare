package com.petory.constant;

/**
 * 경매 입찰 상태
 */
public enum AuctionBidStatus {
    
    SUCCESS("입찰 성공"),
    FAILED("입찰 실패");
    
    private final String description;
    
    AuctionBidStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 