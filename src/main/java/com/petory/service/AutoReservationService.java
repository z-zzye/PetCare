package com.petory.service;

import com.petory.constant.ReservationStatus;
import com.petory.constant.VaccineType;
import com.petory.dto.autoReservation.AvailableSlotResponseDto;
import com.petory.dto.autoReservation.ReservationConfirmRequestDto;
import com.petory.dto.autoReservation.SlotSearchRequestDto;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import com.petory.repository.PetRepository;
import com.petory.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AutoReservationService {

  private final PetRepository petRepository;
  private final ReservationRepository reservationRepository;
  private final RestTemplate restTemplate;

  /**
   * [1단계: 탐색] 사용자의 조건에 맞는 예약 가능한 병원/시간 슬롯 목록을 반환합니다.
   */
  @Transactional(readOnly = true) // DB 변경이 없으므로 readOnly 설정
  public List<AvailableSlotResponseDto> findAvailableSlots(SlotSearchRequestDto requestDto) {
    log.info("예약 가능 슬롯 탐색 시작: petId={}, radius={}", requestDto.getPetId(), requestDto.getRadius());

    // 1. 접종 기록을 바탕으로 예약이 필요한 날짜들을 계산합니다.
    Pet pet = petRepository.findById(requestDto.getPetId())
      .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));
    List<LocalDate> targetDates = calculateNextVaccinationDates(pet, requestDto.getVaccineTypes());
    if (targetDates.isEmpty()) {
      log.info("더 이상 예약할 접종이 없습니다.");
      return List.of(); // 빈 리스트 반환
    }

    // 2. 가장 빠른 접종일을 기준으로 더미 서버에 예약 가능 여부를 조회합니다.
    LocalDate earliestDate = targetDates.get(0);

    String url = UriComponentsBuilder.fromHttpUrl("http://localhost:3001/api/hospitals/check-availability")
      .queryParam("lat", requestDto.getLocation().getLat())
      .queryParam("lng", requestDto.getLocation().getLng())
      .queryParam("radius", requestDto.getRadius())
      .queryParam("targetDate", earliestDate.toString())
      .toUriString();

    try {
      log.info("더미 서버에 예약 가능 슬롯 요청: {}", url);
      // 더미 서버가 반환하는 JSON 배열을 List<AvailableSlotResponseDto>로 바로 변환
      ResponseEntity<List<AvailableSlotResponseDto>> response = restTemplate.exchange(
        url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

      log.info("{}개의 예약 가능한 슬롯을 찾았습니다.", response.getBody() != null ? response.getBody().size() : 0);
      return response.getBody();
    } catch (RestClientException e) {
      log.error("더미 서버 호출 중 예외 발생", e);
      throw new IllegalStateException("병원 정보를 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * [2단계: 확정] 사용자가 선택한 슬롯으로 최종 예약을 생성하고 '예약 보류' 상태로 저장합니다.
   */
  @Transactional
  public Reservation confirmReservation(ReservationConfirmRequestDto requestDto) {
    log.info("예약 확정 요청: petId={}, hospitalId={}", requestDto.getPetId(), requestDto.getHospitalId());

    // 1. 더미 서버에 해당 슬롯을 선점(예약 처리)하도록 요청합니다.
    String url = "http://localhost:3001/api/hospitals/reserve-slot";
    ResponseEntity<Map> response;
    try {
      response = restTemplate.postForEntity(url, requestDto, Map.class);
    } catch (RestClientException e) {
      log.error("예약 슬롯 선점 중 오류 발생", e);
      throw new IllegalStateException("예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }

    // 2. 더미 서버의 응답을 확인하여 선점 실패 시 예외 처리
    if (response.getBody() == null || !(boolean) response.getBody().get("success")) {
      throw new IllegalStateException("해당 시간대는 방금 다른 사용자가 예약했습니다. 다른 시간을 선택해주세요.");
    }
    Map<String, Object> reservedInfo = response.getBody();

    // 3. 우리 DB에 '예약 보류' 상태로 예약 정보 저장
    Pet pet = petRepository.findById(requestDto.getPetId())
      .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));

    Reservation reservation = new Reservation();
    reservation.setPet(pet);
    reservation.setMember(pet.getMember());
    reservation.setHospitalName((String) reservedInfo.get("hospitalName"));
    reservation.setReservationDateTime(LocalDateTime.parse((String) reservedInfo.get("confirmedDateTime")));
    reservation.setReservationStatus(ReservationStatus.PENDING); // '예약 보류' 상태

    reservation.setPaymentDueDate(LocalDateTime.now().plusDays(3));
    reservation.setReservedHospitalId(requestDto.getHospitalId());
    reservation.setReservedDate(LocalDate.parse(requestDto.getTargetDate()));
    reservation.setReservedTimeSlot(requestDto.getTimeSlot());

    log.info("새로운 예약이 '보류' 상태로 DB에 저장되었습니다.");
    return reservationRepository.save(reservation);
  }


  /**
   * 스마트 Enum을 사용하여 다음 접종일을 계산하는 메서드
   */
  private List<LocalDate> calculateNextVaccinationDates(Pet pet, List<String> selectedVaccineNames) {
    // 1. DB에서 모든 완료된 접종 기록과 가장 최근 접종 완료일을 가져옵니다.
    List<Reservation> completedReservations = reservationRepository.findByPetAndReservationStatus(pet, ReservationStatus.COMPLETED);
    Optional<Reservation> lastCompleted = reservationRepository.findTopByPetAndReservationStatusOrderByReservationDateTimeDesc(pet, ReservationStatus.COMPLETED);

    // 2. 완료된 접종 기록을 백신 종류별로 카운팅합니다. (예: {DOG_COMPREHENSIVE: 2, DOG_RABIES: 1})
    Map<VaccineType, Long> completedCounts = completedReservations.stream()
            .collect(Collectors.groupingBy(Reservation::getVaccineType, Collectors.counting()));

    List<LocalDate> nextDates = selectedVaccineNames.stream()
      .map(VaccineType::valueOf) // 문자열을 Enum으로 변환
      .filter(vaccine -> { // 아직 접종 횟수가 남은 백신만 필터링
        long alreadyDone = completedCounts.getOrDefault(vaccine, 0L);
        return alreadyDone < vaccine.getTotalShots();
      })
      .map(vaccine -> { // 각 백신별 이상적인 다음 접종일 계산
        long alreadyDone = completedCounts.getOrDefault(vaccine, 0L);
        return pet.getPet_Birth()
          .plusWeeks(vaccine.getStartWeeks())
          .plusWeeks(alreadyDone * vaccine.getIntervalWeeks());
      })
      .map(idealDate -> { // ✅ [핵심] 날짜 보정 규칙 적용
        LocalDate today = LocalDate.now();
        LocalDate minGracePeriodDate = today.plusWeeks(1); // 최소 유예 기간: 오늘 + 1주
        LocalDate minIntervalDate = lastCompleted
          .map(r -> r.getReservationDateTime().toLocalDate().plusWeeks(3))
          .orElse(today); // 다른 백신과의 최소 간격: 마지막 접종일 + 3주

        LocalDate earliestPossibleDate = minGracePeriodDate.isAfter(minIntervalDate) ? minGracePeriodDate : minIntervalDate;

        // 이상적인 날짜가 이미 지났거나, 최소 확보해야 하는 날짜보다 이르면, 보정된 날짜를 사용
        return idealDate.isBefore(earliestPossibleDate) ? earliestPossibleDate : idealDate;
      })
      .collect(Collectors.toList());

    // 3. 계산된 날짜들을 오름차순으로 정렬하여 반환
    return nextDates.stream().sorted().collect(Collectors.toList());
  }
}

