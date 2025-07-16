package com.petory.dto.shop;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionDeliveryDto {
    private Long deliveryId;
    private Long historyId;
    private String receiverName;
    private String receiverPhone;
    private String deliveryAddress;
    private String deliveryAddressDetail;
    private String deliveryMemo;
    private String deliveryName;
    private LocalDateTime deliveryInputAt;
    private LocalDateTime deliveryDeadline;
    private String auctionWinStatus;
}
