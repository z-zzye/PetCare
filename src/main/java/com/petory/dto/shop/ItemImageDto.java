package com.petory.dto.shop;

import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//상품 이미지
public class ItemImageDto {
  @NotNull(message = "이미지 파일은 필수입니다.") //유효성 검사하는 어노테이션 추가
  private MultipartFile file;           // ✅ 업로드할 이미지 파일
  private String url; // 이미지 경로
  private boolean isRepresentative;     // ✅ 대표 이미지 여부

  // JPA 쿼리용 생성자 명시적으로 추가
  public ItemImageDto(String url, boolean isRepresentative) {
    this.url = url;
    this.isRepresentative = isRepresentative;
  }
}
