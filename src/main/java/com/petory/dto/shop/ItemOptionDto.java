package com.petory.dto.shop;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//상품 옵션
public class ItemOptionDto {
  private Long optionId; // 옵션 식별자 추가
  @NotBlank(message = "옵션명은 필수입니다.") //유효성 검사하는 어노테이션 추가
  private String optionName; //옵션명(빨강/s, 빨강/m . . .))

  @NotNull(message = "추가금액은 필수입니다.")
  @Min(value = 0, message = "추가금액은 0 이상이어야 합니다.")
  private Integer optionAddPrice; //추가금액

  @NotNull(message = "재고수량은 필수입니다.")
  @Min(value = 0, message = "재고수량은 0 이상이어야 합니다.")
  private Integer optionStock; //옵션별 재고수량
}
