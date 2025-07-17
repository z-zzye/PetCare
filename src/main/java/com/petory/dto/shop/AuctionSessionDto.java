package com.petory.dto.shop;

import com.petory.constant.AuctionSessionStatus;
import com.petory.entity.shop.AuctionItem;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionSessionDto {

    private Long sessionId; // 세션 ID

    private Long auctionItemId; // 경매 상품 ID

    private String sessionKey; // 세션 고유 키

    private Integer participantCount; // 현재 참여자 수

    private AuctionSessionStatus status; // 세션 상태

    private LocalDateTime startTime; // 세션 시작 시간
    private LocalDateTime endTime; // 세션 종료 시간

    private LocalDateTime createdAt; // 생성 시간
    private LocalDateTime updatedAt; // 수정 시간

    // 세션 상태 관련
    private boolean isActive; // 활성화 상태
    private boolean isFull; // 참여자 수 제한 도달 여부
    private long remainingTime; // 남은 시간 (초)

}
