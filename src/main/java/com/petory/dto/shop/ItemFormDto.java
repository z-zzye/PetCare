package com.petory.dto.shop;

import com.petory.constant.ItemStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor //기본생성자 (파라미터 없는) 자동 생성
@AllArgsConstructor //모든필드를 파라미터로 받는 생성자 자동 생성
@Builder
//상품 등록
public class ItemFormDto {
  @NotNull(message = "카테고리는 필수입니다.") //유효성 검사하는 어노테이션 추가
  private Long categoryId;

  @NotBlank(message = "상품명은 필수입니다.")
  private String itemName;

  @NotBlank(message = "상세 설명은 필수입니다.")
  private String itemDescription;

  @NotNull(message = "가격은 필수입니다.")
  @Min(value = 0, message = "가격은 0원 이상이어야 합니다.")
  private Integer itemPrice;

  @NotNull(message = "상품 상태는 필수입니다.")
  private ItemStatus itemStatus;

  @Valid
  private List<ItemOptionDto> options;

  private List<ItemImageDto> images;
}
