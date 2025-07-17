package com.petory.dto.shop;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionParticipantDto {
    
    private Long participantId; // 참여자 ID
    
    private Long sessionId; // 세션 ID
    private String sessionKey; // 세션 키
    
    private Long memberId; // 회원 ID
    private String memberNickname; // 회원 닉네임
    private String memberProfileImage; // 회원 프로필 이미지
    
    private String connectionId; // WebSocket 연결 ID
    
    private LocalDateTime joinedAt; // 입장 시간
    private LocalDateTime lastActivity; // 마지막 활동 시간
    
    private Boolean isActive; // 현재 접속 중인지
    private Boolean isOnline; // 온라인 상태
    
    private Integer totalBids; // 총 입찰 횟수
    private Integer highestBidAmount; // 최고 입찰가
    
    // 실시간 정보
    private String currentStatus; // 현재 상태 (입찰 중, 관찰 중 등)
    private LocalDateTime lastBidTime; // 마지막 입찰 시간
    private Integer lastBidAmount; // 마지막 입찰 금액
    
    // 참여자 정보
    private Integer totalParticipants; // 전체 참여자 수
    
    // 세션 정보
    private String auctionItemName; // 경매 상품명
    private Integer currentPrice; // 현재 경매가
    private Long remainingTime; // 남은 시간 (초)
} 