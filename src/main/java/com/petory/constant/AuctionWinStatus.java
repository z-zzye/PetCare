package com.petory.constant;

public enum AuctionWinStatus { //배송지 미입력시 낙찰 취소 처리를 위한 ENUM
    WIN,        // 낙찰됨(배송지 입력 대기)
    DELIVERED,  // 배송지 입력 완료
    CANCELLED   // 미입력 자동취소
}
