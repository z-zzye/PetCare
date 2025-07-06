package com.petory.dto.shop;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetailDto {
    private String merchantUid; // 주문번호
    private String orderStatus; // 주문상태
    private LocalDateTime orderDate; // 주문일자
    private int totalPrice; //총 주문 금액
    private int usedMileage; //사용한 마일리지
    private int deliveryFee; //배송비
    private String paymentMethod; // 결제수단

    // 회원 정보 (관리자용)
    private String memberEmail; // 주문한 회원 이메일

    // 배송지 정보
    private String receiverName; //받는사람
    private String receiverPhone; //연락처
    private String address; //주소
    private String deliveryName; //배송지명
    private String orderMemo; //배송메모

    // 주문 상품 목록
    private List<OrderItemDto> orderItems;
}
