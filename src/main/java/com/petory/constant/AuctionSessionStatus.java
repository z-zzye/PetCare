package com.petory.constant;

public enum AuctionSessionStatus {
    WAITING,    // 대기중 (경매 시작 전, 세션은 생성됨)
    ACTIVE,     // 진행중 (실시간 경매 진행)
    PAUSED,     // 일시정지 (관리자가 일시 중단)
    ENDED       // 종료 (세션 종료)
}
