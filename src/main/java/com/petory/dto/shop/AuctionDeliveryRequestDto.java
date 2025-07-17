package com.petory.dto.shop;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuctionDeliveryRequestDto { //입력용
    private String receiverName;
    private String receiverPhone;
    private String deliveryAddress;
    private String deliveryAddressDetail;
    private String deliveryMemo;
    private String deliveryName;
}
