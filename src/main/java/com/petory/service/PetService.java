package com.petory.service;

import com.petory.dto.PetRegisterDto;
import com.petory.entity.Member;
import com.petory.entity.Pet;
import com.petory.repository.MemberRepository;
import com.petory.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PetService {
  private final PetRepository petRepository;
  private final MemberRepository memberRepository;
  private final ImageService imageService;

  public void registerPet(PetRegisterDto dto) {
    String imageUrl = null;
    if (dto.getPet_ProfileImg() != null && !dto.getPet_ProfileImg().isEmpty()) {
      try {
        imageUrl = imageService.uploadFile(dto.getPet_ProfileImg(), "petprofile");
      } catch (Exception e) {
        throw new RuntimeException("이미지 업로드 실패", e);
      }
    }
    Member member = memberRepository.findById(dto.getMemberId())
      .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

    Pet pet = new Pet();
    pet.setMember(member);
    pet.setPet_Name(dto.getPet_Name());
    pet.setPet_Gender(dto.getPet_Gender());
    pet.setPet_Birth(dto.getPet_Birth());
    pet.setIsNeutered(dto.getIsNeutered());
    pet.setPet_ProfileImg(imageUrl);
    pet.setPet_Category(dto.getPet_Category());

    petRepository.save(pet);
  }

  public List<Pet> getPetsByMember(Long memberId) {
    return petRepository.findByMemberId(memberId);
  }
}
