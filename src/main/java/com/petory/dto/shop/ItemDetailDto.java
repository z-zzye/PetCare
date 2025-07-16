package com.petory.dto.shop;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//상품 상세 페이지
public class ItemDetailDto {
    private Long itemId;
    private String itemName;
    private Integer itemPrice;
    private String itemDescription;
    private String categoryName;
    private List<String> categoryPath;
    private String itemStatus; // 상품 판매 상태(SELL, SOLD_OUT 등)
    private List<ItemImageDto> images; // 대표/추가 이미지 정보
    private List<ItemOptionDto> options; // 옵션 목록
}
