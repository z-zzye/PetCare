package com.petory.dto.shop;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//장바구니 상품
public class CartItemDto {
    private Long cartItemId;
    private ItemDto item;
    private int quantity;
    private ItemOptionDto option;
}
