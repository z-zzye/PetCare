package com.petory.dto;

import com.petory.constant.Gender;
import com.petory.constant.Neutered;
import com.petory.constant.PetCategory;
import com.petory.entity.Pet;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PetDto {

  private Long petNum;
  private String petName;
  private Gender petGender;
  private LocalDate petBirth;
  private Neutered isNeutered;
  private PetCategory petCategory;
  private String petProfileImg;

  public static PetDto from(Pet pet) {
    PetDto dto = new PetDto();
    dto.setPetNum(pet.getPet_Num());
    dto.setPetName(pet.getPet_Name());
    dto.setPetGender(pet.getPet_Gender());
    dto.setPetBirth(pet.getPet_Birth());
    dto.setIsNeutered(pet.getIsNeutered());
    dto.setPetCategory(pet.getPet_Category());
    dto.setPetProfileImg(pet.getPet_ProfileImg());

    return dto;
  }
}
