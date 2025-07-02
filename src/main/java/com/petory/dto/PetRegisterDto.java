package com.petory.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.petory.constant.Gender;
import com.petory.constant.Neutered;
import com.petory.constant.PetCategory;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Getter
@Setter
public class PetRegisterDto {
  private Long memberId;
  private String pet_Name;
  private Gender pet_Gender;
  private LocalDate pet_Birth;
  private Neutered isNeutered;
  private PetCategory pet_Category;

  @JsonIgnore // JSON 직렬화 제외 (폼에선 보내지 않음)
  private MultipartFile pet_ProfileImg;
}
