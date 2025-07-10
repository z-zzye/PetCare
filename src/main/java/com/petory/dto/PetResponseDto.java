package com.petory.dto;

import com.petory.entity.Pet;
import lombok.Getter;

@Getter
public class PetResponseDto {
  private Long petId;
  private String petName;
  // Member 엔티티의 모든 정보 대신 필요한 것만 추가
  private Long memberId;
  private String memberNickname;

  // Pet 엔티티를 받아서 DTO로 변환하는 생성자
  public PetResponseDto(Pet pet) {
    this.petId = pet.getPet_Num();
    this.petName = pet.getPet_Name();
    this.memberId = pet.getMember().getMemberId(); // 프록시 객체가 아닌 실제 데이터 접근
    this.memberNickname = pet.getMember().getMember_NickName();
  }
}
