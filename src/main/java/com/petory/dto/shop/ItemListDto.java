package com.petory.dto.shop;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//상품목록
public class ItemListDto { //상품 목록 페이지 에서 보여질 항목들
    private Long itemId; //상품 상세 페이지로 이동(클릭)시 필요
    private String itemName; //상품명
    private Integer itemPrice; //상품가격
    private String thumbnailUrl; // 대표 이미지(썸네일) URL
}
