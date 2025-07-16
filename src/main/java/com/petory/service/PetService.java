package com.petory.service;

import com.petory.constant.AutoVaxStatus;
import com.petory.constant.ReservationStatus;
import com.petory.dto.PetRegisterDto;
import com.petory.dto.autoReservation.PetAutoVaxSettingsDto;
import com.petory.entity.Member;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import com.petory.repository.MemberRepository;
import com.petory.repository.PetRepository;
import com.petory.repository.ReservationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PetService {
  private final PetRepository petRepository;
  private final MemberRepository memberRepository;
  private final ImageService imageService;
  private final ReservationRepository reservationRepository;
  private final RestTemplate restTemplate;

  public Pet registerPet(PetRegisterDto dto) {
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
    pet.setAutoVaxStatus(AutoVaxStatus.UNKNOWN);

    return petRepository.save(pet);
  }

  public Pet findById(Long petId) {
    return petRepository.findById(petId)
      .orElseThrow(() -> new RuntimeException("해당 ID의 펫이 존재하지 않습니다."));
  }

  public List<Pet> getPetsByMember(Long memberId) {
    return petRepository.findByMemberId(memberId);
  }

  @Transactional
  public Pet updatePet(Long petId, PetRegisterDto dto) throws Exception {
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

    return pet;
  }

  // 자동 예약 여부 자체를 저장하는 서비스 (자동예약 신청 완료 / 거부)
  @Transactional
  public void updateAutoVaxConsent(Long petId, String status, String userEmail) {
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new RuntimeException("해당 펫이 존재하지 않습니다."));
    if (!pet.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("해당 펫에 대한 권한이 없습니다.");
    }

    try {
      AutoVaxStatus consentStatus = AutoVaxStatus.valueOf(status.toUpperCase());
      pet.setAutoVaxStatus(consentStatus);
    } catch (Exception e) {
      log.error("자동예약 여부 저장 실패",  e);
    }
  }

  /**
   * [신규] 자동 접종 서비스 신청 시, 관리할 백신과 선호 정보를 저장합니다.
   */
  @Transactional
  public void saveAutoVaxSettings(Long petId, PetAutoVaxSettingsDto dto, String userEmail) {
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new IllegalArgumentException("해당 펫이 존재하지 않습니다."));

    // 소유권 확인
    if (!pet.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("해당 펫에 대한 권한이 없습니다.");
    }

    // 1. 관리할 백신 목록을 String으로 변환하여 저장
    if (dto.getManagedVaccineTypes() != null) {
      String vaccineNames = String.join(",", dto.getManagedVaccineTypes());
      pet.setManagedVaccineTypes(vaccineNames);
    }

    // 2. 선호 병원 ID 저장
    pet.setPreferredHospital(dto.getPreferredHospitalId());

    // 3. 선호 요일 저장
    if (dto.getPreferredDays() != null) {
      pet.setPreferredDaysOfWeek(dto.getPreferredDays());
    }

    // 4. 선호 시간대 저장
    if (dto.getPreferredTime() != null) {
      pet.setPreferredTime(dto.getPreferredTime());
    }

    // 자동 예약에 동의했음으로 상태 변경
    pet.setAutoVaxStatus(AutoVaxStatus.AGREED);
  }

  /**
   * ✅ [수정] 펫과 관련된 모든 데이터(프로필 이미지, DB 예약, 더미서버 예약)를
   * 안전하게 삭제하는 새로운 로직으로 교체합니다.
   */
  @Transactional
  public void deletePet(Long petId) throws Exception {
    // 1. 삭제할 펫 엔티티를 조회합니다.
    Pet pet = petRepository.findById(petId)
      .orElseThrow(() -> new IllegalArgumentException("해당 펫이 존재하지 않습니다."));

    // 2. 해당 펫과 연결된 모든 예약을 조회합니다.
    List<Reservation> reservations = reservationRepository.findByPet(pet);

    // 3. '보류(PENDING)' 상태인 예약이 있다면, 더미 서버에 슬롯 취소를 요청합니다.
    for (Reservation reservation : reservations) {
      if (reservation.getReservationStatus() == ReservationStatus.PENDING) {
        cancelDummyServerSlot(reservation);
      }
    }

    // 4. 기존 프로필 이미지가 있다면 파일 시스템에서 삭제합니다.
    if (pet.getPet_ProfileImg() != null && !pet.getPet_ProfileImg().isEmpty()) {
      imageService.deleteFile(pet.getPet_ProfileImg());
    }

    // 5. 마지막으로 펫을 삭제합니다.
    // (Pet 엔티티의 cascade 옵션에 의해 DB의 Reservation 데이터도 함께 삭제됩니다.)
    petRepository.delete(pet);
  }

  private void cancelDummyServerSlot(Reservation reservation) {
    String url = "http://localhost:3001/api/hospitals/cancel-slot";
    Map<String, String> requestBody = new HashMap<>();
    requestBody.put("hospitalId", reservation.getReservedHospitalId());
    requestBody.put("targetDate", reservation.getReservedDate().toString());
    requestBody.put("timeSlot", reservation.getReservedTimeSlot());

    try {
      restTemplate.postForEntity(url, requestBody, Map.class);
    } catch (Exception e) {
      // 더미 서버 통신 실패가 전체 펫 삭제를 막지 않도록 로그만 남깁니다.
      log.error("더미 서버 슬롯 취소 요청 실패: Reservation ID {}", reservation.getId(), e);
    }
  }
}
