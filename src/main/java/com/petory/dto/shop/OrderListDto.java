package com.petory.dto.shop;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderListDto {
    private String merchantUid;      // 주문번호
    private String orderStatus;      // 주문상태
    private LocalDateTime orderDate; // 주문일자
    private int totalPrice;          // 총 결제금액
    private int deliveryFee;         // 배송비
    private int usedMileage;         // 사용 마일리지
    private List<OrderItemDto> orderItems; // 주문상품 전체(옵션명, 수량, 추가금 등 포함)
}
