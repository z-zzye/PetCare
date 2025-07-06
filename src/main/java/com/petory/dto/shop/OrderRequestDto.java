package com.petory.dto.shop;

import lombok.*;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDto { //결제 및 주문 전체 정보
    private String impUid;
    private String merchantUid;
    private int totalPrice;
    private List<OrderItemDto> orderItems;
    private AddressInfoDto addressInfo;
    private int usedMileage;
    private Long memberId;
    private String orderMemo;



}
