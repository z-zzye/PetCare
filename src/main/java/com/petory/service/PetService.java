package com.petory.service;

import com.petory.dto.PetRegisterDto;
import com.petory.entity.Member;
import com.petory.entity.Pet;
import com.petory.repository.MemberRepository;
import com.petory.repository.PetRepository;
import jakarta.transaction.Transactional;
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
        imageUrl = imageService.uploadFile(dto.getPet_ProfileImg(), "petProfile");
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

  public Pet findById(Long petId) {
    return petRepository.findById(petId)
      .orElseThrow(() -> new RuntimeException("해당 ID의 펫이 존재하지 않습니다."));
  }

  public List<Pet> getPetsByMember(Long memberId) {
    return petRepository.findByMemberId(memberId);
  }

  @Transactional
  public void updatePet(Long petId, PetRegisterDto dto) throws Exception {
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new RuntimeException("해당 펫이 존재하지 않습니다."));

    // 기존 이미지 교체 처리
    String imageUrl = pet.getPet_ProfileImg(); // 기본값: 기존 이미지 유지
    if (dto.getPet_ProfileImg() != null && !dto.getPet_ProfileImg().isEmpty()) {
      imageUrl = imageService.uploadFile(dto.getPet_ProfileImg(), "petProfile");
    }

    // 필드 업데이트
    pet.setPet_Name(dto.getPet_Name());
    pet.setPet_Gender(dto.getPet_Gender());
    pet.setPet_Birth(dto.getPet_Birth());
    pet.setIsNeutered(dto.getIsNeutered());
    pet.setPet_ProfileImg(imageUrl);
    pet.setPet_Category(dto.getPet_Category());

    // JPA 더티 체킹으로 save() 없이도 수정 완료
  }

  @Transactional
  public void deletePet(Long petId) throws Exception {
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new IllegalArgumentException("해당 펫이 존재하지 않습니다."));

    // 1. 프로필 이미지 파일이 있을 경우 삭제
    if (pet.getPet_ProfileImg() != null && !pet.getPet_ProfileImg().isEmpty()) {
      imageService.deleteFile(pet.getPet_ProfileImg());
    }

    // 2. 펫 DB 정보 삭제
    petRepository.delete(pet);
  }
}
