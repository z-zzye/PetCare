package com.petory.constant;

public enum AuctionBidStatus { //경매 입찰 상태

    SUCCESS("입찰 성공"),
    FAILED("입찰 실패"),
    CANCELED("입찰 취소/유찰");

    private final String description;

    AuctionBidStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
