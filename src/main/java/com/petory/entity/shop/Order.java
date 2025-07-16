package com.petory.entity.shop;

import com.petory.entity.BaseEntity;
import com.petory.entity.Member;
import com.petory.constant.DeliveryName;
import com.petory.constant.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Order extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    // 주문자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    // 주문일시 (BaseEntity의 regTime 사용)
    // private LocalDateTime orderDate;

    // 주문상태 //결제완료,배송중,배송완료,취소,구매확정
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    // 배송지명 //선택radio-ex)집,회사,학교,기타
    @Enumerated(EnumType.STRING)
    private DeliveryName deliveryName;

    // 받는사람
    private String receiverName;

    // 연락처
    private String receiverPhone;

    // 주소
    private String address;

    // 결제수단
    private String paymentMethod;

    // 주문번호(merchantUid, 결제사와 연동되는 고유값) - 구매취소(환불)시 필요
    @Column(unique = true, nullable = false)
    private String merchantUid;

    // 아임포트 결제 고유번호(impUid, 환불 시 필요)
    @Column(name = "imp_uid", unique = true)
    private String impUid;

    // 주문 상품들
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>();

    // 총금액
    private int totalPrice;

    // 마일리지 사용
    private int usedMileage;

    // 배송비
    private int deliveryFee;

    // 주문메모 (고객 요청사항)
    private String orderMemo;

}
