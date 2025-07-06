package com.petory.dto.shop;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//주문 상품별 정보
public class OrderItemDto { 
    private Long itemId;         // 상품 ID
    private String itemName;     // 상품명
    private String thumbnailUrl;    // 대표이미지 (URL 또는 파일명)
    private Long optionId;       // 옵션 ID (nullable)
    private String optionName;   // 옵션명 (예: 빨강, L 등)
    private int quantity;           // 수량
    private int orderPrice;      // 주문 당시 가격 (옵션 추가금액 포함)
    private Integer optionAddPrice; // 옵션 추가금액 (nullable)
} 