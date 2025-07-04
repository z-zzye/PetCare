package com.petory.dto.shop;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemDto { //CartItem에 전달할 상품 정보들
    private Long itemId;
    private String itemName;
    private Integer itemPrice;
    private String thumbnailUrl; // 대표 이미지(썸네일) URL
}
