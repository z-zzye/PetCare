package com.petory.dto.shop;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderListResponseDto {
    private int memberMileage; // 회원의 전체 보유 마일리지
    private List<OrderListDto> orders; // 주문 내역 리스트
}
