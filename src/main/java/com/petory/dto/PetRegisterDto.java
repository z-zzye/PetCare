package com.petory.dto;

import com.petory.constant.Gender;
import com.petory.constant.Neutered;
import com.petory.constant.PetCategory;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PetRegisterDto {
  private Long memberId;
  private String pet_Name;
  private Gender pet_Gender;
  private LocalDate pet_Birth;
  private Neutered isNeutered;
  private String pet_ProfileImg;
  private PetCategory pet_Category;
}
