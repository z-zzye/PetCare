package com.petory.service;

import com.petory.constant.PetCategory;
import com.petory.constant.VaccineType;
import com.petory.dto.autoReservation.VaccineDto;
import com.petory.entity.Pet;
import com.petory.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VaccineService {

  private final PetRepository petRepository;

  public List<VaccineDto> getSelectableVaccines(Long petId) {
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new IllegalArgumentException("해당 펫이 없습니다."));

    PetCategory category = pet.getPet_Category();

    // 모든 VaccineType 중에서 펫의 카테고리와 일치하는 것만 필터링하여 DTO로 변환
    return Arrays.stream(VaccineType.values())
      .filter(vaccineType -> vaccineType.getPetCategory() == category)
      .map(VaccineDto::from)
      .collect(Collectors.toList());
  }
}
