package com.petory.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// 편의 시설 정보 DTO
@Getter
@Setter
@AllArgsConstructor
public class AmenityDto {
  private String name;        // 장소 이름
  private String address;     // 주소
  private String distance;    // 기준점으로부터의 거리
  private String placeUrl;    // 장소 상세 정보 URL
}
