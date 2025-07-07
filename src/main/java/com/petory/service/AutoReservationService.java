package com.petory.service;

import com.petory.constant.PetCategory;
import com.petory.dto.AutoReservationRequestDto;
import com.petory.entity.Pet;
import com.petory.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate; // 외부 API 호출을 위해 RestTemplate 사용

import java.time.LocalDate;
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

  public void startAutoReservationProcess(AutoReservationRequestDto requestDto) {
    // 1. petId로 펫 정보 조회
    Pet pet = petRepository.findById(requestDto.getPetId())
      .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));

    // 2. 펫 정보 기반으로 다음 접종일 계산
    List<LocalDate> targetDates = calculateNextVaccinationDates(pet);
    if (targetDates.isEmpty()) {
      log.info("{}는 다음 자동 예약 대상 접종이 없습니다.", pet.getPet_Name());
      // 여기서 사용자에게 알림을 보내는 로직을 추가할 수 있습니다.
      return;
    }

    // 3. 외부 병원 API를 호출하여 예약 가능한 병원/시간 찾기 (더미 서버 연동 부분)
    // TODO: 이 부분은 실제 더미 서버 API 명세에 맞게 수정해야 합니다.
    Map<String, Object> availableReservation = findAvailableHospitalsFromExternalApi(
      requestDto.getLocation(),
      targetDates,
      requestDto.getPreferredTime()
    );

    if (availableReservation == null) {
      log.warn("ID:{} 펫에 대해 예약 가능한 병원을 찾지 못했습니다.", pet.getPet_Num());
      // 여기서도 사용자에게 "예약 가능한 병원을 찾지 못했다"는 알림을 보낼 수 있습니다.
      return;
    }

    // 4. 예약 확정 및 DB 저장, 예약금 결제
    // TODO: 찾은 병원 정보로 실제 예약을 확정하고, 우리 DB에 예약 정보를 저장하는 로직
    log.info("예약 확정 정보: {}", availableReservation);

    // TODO: 이전에 구현한 빌링키(Billing Key)를 이용해 예약금을 결제하는 로직
  }

  /**
   * 펫의 종류와 생일에 따라 다음 접종일을 계산하는 메서드
   */
  private List<LocalDate> calculateNextVaccinationDates(Pet pet) {
    List<LocalDate> dates = new ArrayList<>();
    LocalDate birthDate = pet.getPet_Birth();

    if (pet.getPet_Category() == PetCategory.CAT) {
      // 고양이 접종 스케쥴 로직
      // 예시: 종합백신 (생후 6주 이후, 3주 간격 3차)
      LocalDate firstShotDate = birthDate.plusWeeks(6);
      dates.add(firstShotDate);
      dates.add(firstShotDate.plusWeeks(3));
      dates.add(firstShotDate.plusWeeks(6));

    } else if (pet.getPet_Category() == PetCategory.DOG) {
      // 강아지 접종 스케쥴 로직
      // 예시: 종합백신 (생후 6주 이후, 3주 간격 5차)
      LocalDate firstShotDate = birthDate.plusWeeks(6);
      dates.add(firstShotDate);
      dates.add(firstShotDate.plusWeeks(3));
      dates.add(firstShotDate.plusWeeks(6));
      dates.add(firstShotDate.plusWeeks(9));
      dates.add(firstShotDate.plusWeeks(12));
    }

    // TODO: 이미 맞은 접종 기록을 확인하여, 다음 맞아야 할 접종 날짜만 반환하는 로직 추가 필요
    // 지금은 모든 예상 접종일을 반환합니다.

    return dates;
  }

  /**
   * 외부 더미 서버 API를 호출하여 예약 가능한 병원 정보를 가져오는 것을 시뮬레이션
   */
  private Map<String, Object> findAvailableHospitalsFromExternalApi(
    AutoReservationRequestDto.LocationDto location,
    List<LocalDate> targetDates,
    String preferredTime) {

    String dummyApiUrl = "http://localhost:3001/api/hospitals/availability";

    // 1. HTTP 헤더 설정
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    // 2. 요청 본문(Body) 데이터 생성
    Map<String, Object> searchLocation = Map.of("latitude", location.getLat(), "longitude", location.getLng());
    List<String> possibleDates = targetDates.stream()
      .map(date -> date.format(DateTimeFormatter.ISO_LOCAL_DATE))
      .collect(Collectors.toList());

    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("searchLocation", searchLocation);
    requestBody.put("possibleDates", possibleDates);
    requestBody.put("timeSlot", preferredTime);

    // 3. 요청 엔티티 생성
    HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

    try {
      log.info("더미 서버에 예약 요청 전송: {}", requestBody);
      // 4. RestTemplate으로 POST 요청 보내기
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
      // 더미 서버가 꺼져있는 등 네트워크 오류가 발생했을 때
      return null;
    }
  }
}
