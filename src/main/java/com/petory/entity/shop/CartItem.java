package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "cart_item")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartItemId;

    // Cart와 N:1 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id")
    private Cart cart;

    // 상품 연관관계 (정규화)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    // 옵션 정보(옵션이 있다면)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private ItemOption option;

    // 수량 - 장바구니 안에서 수량 변경후 재로그인 해도 수량이 그대로 유지되어야 하기 때문에
    //       수량 변경할때마다 동기화
    // 단가, 총 주문 금액은 ItemFormDto에서 수정이 있을때마다 장바구니에 최신 가격이 반영되어야
    // 하기 때문에 DB에는 저장하지 X / 프론트에서 보여주기
    private int quantity;

    // 수량 변경 등 비즈니스 메서드 필요시 추가 가능
}
