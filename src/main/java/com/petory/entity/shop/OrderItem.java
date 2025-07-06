package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;

    // 주문
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // 상품
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    // 주문 당시 가격
    private int orderPrice;

    // 수량
    private int count;

    // 주문 당시 상품명
    private String itemName;

    // 주문 당시 대표이미지 (URL 또는 파일명)
    private String itemImage;

    // 선택한 옵션명 (예: 색상, 사이즈 등)
    private String optionName;

    // 옵션 추가금액 (nullable)
    private Integer optionAddPrice;
}
