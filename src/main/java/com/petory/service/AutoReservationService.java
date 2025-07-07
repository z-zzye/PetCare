package com.petory.service;

import com.petory.constant.PetCategory;
import com.petory.constant.ReservationStatus;
import com.petory.constant.VaccineType;
import com.petory.dto.AutoReservationRequestDto;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import com.petory.repository.PetRepository;
import com.petory.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AutoReservationService {

  private final PetRepository petRepository;
  private final RestTemplate restTemplate;
  private final ReservationRepository reservationRepository; // ✅ 주입 확인

  public Map<String, Object> startAutoReservationProcess(AutoReservationRequestDto requestDto) {
    Pet pet = petRepository.findById(requestDto.getPetId())
            .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));

    // ✅ 개선된 로직으로 다음 접종일 계산
    List<LocalDate> targetDates = calculateNextVaccinationDates(pet);
    if (targetDates.isEmpty()) {
      throw new IllegalStateException("다음 접종 대상이 없습니다.");
    }

    Map<String, Object> availableReservation = findAvailableHospitalsFromExternalApi(
            requestDto.getLocation(),
            targetDates,
            requestDto.getPreferredTime()
    );

    if (availableReservation == null) {
      throw new IllegalStateException("예약 가능한 병원을 찾지 못했습니다.");
    }

    // ▼▼▼▼▼ 4단계: 예약 정보 저장 및 결제 로직 구체화 ▼▼▼▼▼
    Reservation reservation = new Reservation();
    reservation.setPet(pet);
    reservation.setMember(pet.getMember());
    reservation.setHospitalName((String) availableReservation.get("hospitalName"));
    reservation.setReservationDateTime(LocalDateTime.parse((String) availableReservation.get("confirmedDateTime")));

    // 예약 상태를 '확정'으로 설정
    reservation.setReservationStatus(ReservationStatus.CONFIRMED);

    // TODO: 어떤 종류의 백신 예약인지 결정하는 로직 필요. 지금은 첫 번째 해당 백신으로 설정.
    VaccineType firstApplicableVaccine = findFirstApplicableVaccine(pet.getPet_Category());
    reservation.setVaccineType(firstApplicableVaccine);

    reservationRepository.save(reservation);
    log.info("새로운 예약 정보가 DB에 저장되었습니다. ID: {}", reservation.getId());

    // TODO: BillingService를 이용한 예약금 결제 로직
    log.info("예약금 결제가 성공적으로 처리되었습니다. (시뮬레이션)");

    return availableReservation;
  }

  /**
   * 스마트 Enum을 사용하여 다음 접종일을 계산하는 메서드
   */
  private List<LocalDate> calculateNextVaccinationDates(Pet pet) {
    List<LocalDate> dates = new ArrayList<>();
    LocalDate birthDate = pet.getPet_Birth();
    PetCategory category = pet.getPet_Category();

    // 모든 VaccineType을 순회
    for (VaccineType vaccine : VaccineType.values()) {
      // 이 백신이 해당 펫의 종류와 일치하는지 확인
      if (vaccine.getPetCategory() == category) {
        LocalDate firstShotDate = birthDate.plusWeeks(vaccine.getStartWeeks());
        for (int i = 0; i < vaccine.getTotalShots(); i++) {
          dates.add(firstShotDate.plusWeeks((long) i * vaccine.getIntervalWeeks()));
        }
      }
    }
    // TODO: 이미 맞은 접종 기록을 DB에서 확인하고, dates 리스트에서 제외하는 로직 추가 필요
    return dates;
  }

  // 특정 펫 종류에 해당하는 첫 번째 백신 타입을 찾는 헬퍼 메서드
  private VaccineType findFirstApplicableVaccine(PetCategory petCategory) {
    for (VaccineType vaccine : VaccineType.values()) {
      if (vaccine.getPetCategory() == petCategory) {
        return vaccine;
      }
    }
    return null; // 해당하는 백신이 없는 경우 (예외처리 필요)
  }

  /**
   * 외부 더미 서버 API 호출 (기존과 동일)
   */
  private Map<String, Object> findAvailableHospitalsFromExternalApi(
          AutoReservationRequestDto.LocationDto location,
          List<LocalDate> targetDates,
          String preferredTime) {
    // ... 기존 코드와 동일 ...
    String dummyApiUrl = "http://localhost:3001/api/hospitals/availability";
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    Map<String, Object> searchLocation = Map.of("latitude", location.getLat(), "longitude", location.getLng());
    List<String> possibleDates = targetDates.stream()
            .map(date -> date.format(DateTimeFormatter.ISO_LOCAL_DATE))
            .collect(Collectors.toList());
    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("searchLocation", searchLocation);
    requestBody.put("possibleDates", possibleDates);
    requestBody.put("timeSlot", preferredTime);
    HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
    try {
      log.info("더미 서버에 예약 요청 전송: {}", requestBody);
      ResponseEntity<Map> response = restTemplate.postForEntity(dummyApiUrl, requestEntity, Map.class);
      if (response.getStatusCode().is2xxSuccessful()) {
        log.info("더미 서버로부터 응답 수신: {}", response.getBody());
        return response.getBody();
      } else {
        log.error("더미 서버 응답 오류: {}", response.getStatusCode());
        return null;
      }
    } catch (RestClientException e) {
      log.error("더미 서버 호출 중 예외 발생", e);
      return null;
    }
  }
}

