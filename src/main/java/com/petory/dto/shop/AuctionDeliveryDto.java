package com.petory.dto.shop;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionDeliveryDto { //조회용
    private Long deliveryId;
    private Long historyId;
    private String receiverName; //받는 사람
    private String receiverPhone; //받는사람 연락처
    private String deliveryAddress; //주소
    private String deliveryAddressDetail; //상세주소
    private String deliveryMemo; //배송메세지
    private String deliveryName; //배송지명
    private LocalDateTime deliveryInputAt; //배송지 입력한 날짜
    private LocalDateTime deliveryDeadline; //배송지 입력기한
    private String auctionWinStatus; //배송지 입력 상태

    // 관리자 페이지용 추가 필드
    private String itemName;        // 상품명
    private String winnerName;      // 낙찰자명
    private Integer finalPrice;     // 낙찰가
}
