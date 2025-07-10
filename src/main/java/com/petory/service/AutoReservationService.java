package com.petory.service;

import com.petory.constant.ReservationStatus;
import com.petory.constant.VaccineType;
import com.petory.dto.autoReservation.*;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
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
   * [수정] 백신별 예약 가능일과, 가장 빠른 날짜의 병원 목록을 함께 반환합니다.
   */
  @Transactional(readOnly = true)
  public DetailedSlotSearchResponseDto findAvailableSlots(SlotSearchRequestDto requestDto) {
    log.info("상세 슬롯 탐색 시작: petId={}", requestDto.getPetId());

    Pet pet = petRepository.findById(requestDto.getPetId())
      .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));

    // 1. 선택된 백신별로 각각의 가장 빠른 접종일을 계산합니다.
    List<VaccineDateInfo> vaccineDates = calculateNextVaccineDateInfos(pet, requestDto.getVaccineTypes());

    if (vaccineDates.isEmpty()) {
      log.info("더 이상 예약할 접종이 없습니다.");
      return new DetailedSlotSearchResponseDto(Collections.emptyList(), Collections.emptyList());
    }

    // 2. 이 중 전체에서 가장 빠른 날짜를 찾습니다.
    LocalDate overallEarliestDate = vaccineDates.stream()
      .min(Comparator.comparing(VaccineDateInfo::getDate))
      .get()
      .getDate();

    // 3. 가장 빠른 날짜를 기준으로 예약 가능한 병원 목록을 조회합니다.
    List<AvailableSlotResponseDto> availableSlots = findHospitalsForDate(overallEarliestDate, requestDto);

    // 4. 두 종류의 정보를 모두 담아 반환합니다.
    return new DetailedSlotSearchResponseDto(vaccineDates, availableSlots);
  }

  /**
   * 특정 시작일과 선호 요일을 기준으로 예약 가능한 병원을 탐색하는 헬퍼 메서드
   */
  private List<AvailableSlotResponseDto> findHospitalsForDate(LocalDate earliestDate, SlotSearchRequestDto requestDto) {
    List<DayOfWeek> preferredDays = requestDto.getPreferredDays();
    if (preferredDays == null || preferredDays.isEmpty()) {
      throw new IllegalArgumentException("선호 요일을 하나 이상 선택해야 합니다.");
    }

    for (int i = 0; i < 8; i++) { // 최대 8주까지 탐색
      final LocalDate currentSearchWeekStart = earliestDate.plusWeeks(i);

      // 정렬된 선호 요일 목록을 순회하며 가장 빠른 슬롯을 찾는다.
      List<LocalDate> potentialQueryDates = preferredDays.stream()
        .map(day -> currentSearchWeekStart.with(TemporalAdjusters.nextOrSame(day)))
        .sorted()
        .collect(Collectors.toList());

      for (LocalDate queryDate : potentialQueryDates) {
        String url = UriComponentsBuilder.fromHttpUrl("http://localhost:3001/api/hospitals/check-availability")
          .queryParam("lat", requestDto.getLocation().getLat())
          .queryParam("lng", requestDto.getLocation().getLng())
          .queryParam("radius", requestDto.getRadius())
          .queryParam("targetDate", queryDate.toString())
          .toUriString();

        try {
          log.info("[{}주차] 더미 서버 요청 (날짜: {}): {}", i + 1, queryDate, url);
          ResponseEntity<List<AvailableSlotResponseDto>> response = restTemplate.exchange(
            url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

          List<AvailableSlotResponseDto> slots = response.getBody();
          if (slots != null && !slots.isEmpty()) {
            log.info("성공! {}개의 예약 가능한 슬롯을 찾았습니다.", slots.size());
            return slots; // 결과를 찾으면 즉시 반환
          }
        } catch (RestClientException e) {
          log.error("더미 서버 호출 중 예외 발생", e);
        }
      }
    }
    log.info("최대 탐색 기간(8주) 동안 예약 가능한 슬롯을 찾지 못했습니다.");
    return Collections.emptyList();
  }

  /**
   * [수정] 다음 접종일 계산 결과를 VaccineDateInfo 리스트로 반환합니다.
   */
  private List<VaccineDateInfo> calculateNextVaccineDateInfos(Pet pet, List<String> selectedVaccineNames) {
    List<Reservation> completedReservations = reservationRepository.findByPetAndReservationStatus(pet, ReservationStatus.COMPLETED);
    Optional<Reservation> lastCompleted = reservationRepository.findTopByPetAndReservationStatusOrderByReservationDateTimeDesc(pet, ReservationStatus.COMPLETED);
    Map<VaccineType, Long> completedCounts = completedReservations.stream()
      .collect(Collectors.groupingBy(Reservation::getVaccineType, Collectors.counting()));

    return selectedVaccineNames.stream()
      .map(VaccineType::valueOf)
      .filter(vaccine -> completedCounts.getOrDefault(vaccine, 0L) < vaccine.getTotalShots())
      .map(vaccine -> {
        long alreadyDone = completedCounts.getOrDefault(vaccine, 0L);
        LocalDate idealDate = pet.getPet_Birth()
          .plusWeeks(vaccine.getStartWeeks())
          .plusWeeks(alreadyDone * vaccine.getIntervalWeeks());

        LocalDate today = LocalDate.now();
        LocalDate minGracePeriodDate = today.plusWeeks(1);
        LocalDate minIntervalDate = lastCompleted
          .map(r -> r.getReservationDateTime().toLocalDate().plusWeeks(3))
          .orElse(today);
        LocalDate earliestPossibleDate = minGracePeriodDate.isAfter(minIntervalDate) ? minGracePeriodDate : minIntervalDate;
        LocalDate finalDate = idealDate.isBefore(earliestPossibleDate) ? earliestPossibleDate : idealDate;

        return new VaccineDateInfo(vaccine.name(), vaccine.getDescription(), finalDate);
      })
      .sorted(Comparator.comparing(VaccineDateInfo::getDate))
      .collect(Collectors.toList());
  }

  // (기존 PENDING 상태로 저장하는 메서드)
  public Reservation confirmReservation(ReservationConfirmRequestDto requestDto) {
    return createReservation(requestDto, ReservationStatus.PENDING);
  }

  // (새로 만든 CONFIRMED 상태로 저장하는 메서드), 현재 상태에선 사용 X
  public Reservation confirmAndPayReservation(ReservationConfirmRequestDto requestDto) {
    return createReservation(requestDto, ReservationStatus.CONFIRMED);
  }

  private Reservation createReservation(ReservationConfirmRequestDto requestDto, ReservationStatus status) {
    log.info("예약 생성 요청 (상태: {}): petId={}, hospitalId={}", status, requestDto.getPetId(), requestDto.getHospitalId());

    // 1. 더미 서버 슬롯 선점
    String url = "http://localhost:3001/api/hospitals/reserve-slot";
    ResponseEntity<Map> response;
    try {
      response = restTemplate.postForEntity(url, requestDto, Map.class);
    } catch (RestClientException e) {
      log.error("예약 슬롯 선점 중 오류 발생", e);

      if (e instanceof HttpClientErrorException) {
        // HTTP 상태 코드로 오류를 구분합니다.
        HttpStatusCode statusCode = ((HttpClientErrorException) e).getStatusCode();
        if (statusCode == HttpStatus.CONFLICT) { // 409 Conflict 오류인 경우
          throw new IllegalStateException("해당 시간대는 방금 다른 사용자가 예약했습니다. 다른 시간을 선택해주세요.");
        }
      }
      // 그 외 모든 통신 오류는 기존 메시지 유지
      throw new IllegalStateException("예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }

    // 2. 더미 서버의 응답을 확인하여 선점 실패 시 예외 처리
    if (response.getBody() == null || !(boolean) response.getBody().get("success")) {
      throw new IllegalStateException("해당 시간대는 최근 다른 사용자가 예약했습니다. 다른 시간을 선택해주세요.");
    }
    Map<String, Object> reservedInfo = response.getBody();

    // 3. Reservation 엔티티 생성
    Pet pet = petRepository.findById(requestDto.getPetId())
      .orElseThrow(() -> new IllegalArgumentException("해당 펫을 찾을 수 없습니다."));

    Reservation reservation = new Reservation();
    // vaccineTypes 리스트의 첫 번째 항목을 Reservation의 vaccineType으로 설정
    if (requestDto.getVaccineTypes() != null && !requestDto.getVaccineTypes().isEmpty()) {
      reservation.setVaccineType(VaccineType.valueOf(requestDto.getVaccineTypes().get(0)));
    }
    reservation.setPet(pet);
    reservation.setMember(pet.getMember());
    reservation.setHospitalName((String) reservedInfo.get("hospitalName"));
    reservation.setHospitalAddress(requestDto.getHospitalAddress());
    reservation.setHospitalPhone(requestDto.getHospitalPhone());
    reservation.setReservationDateTime(LocalDateTime.parse((String) reservedInfo.get("confirmedDateTime")));
    reservation.setReservedHospitalId(requestDto.getHospitalId());
    reservation.setReservationStatus(status);
    reservation.setReservedDate(LocalDate.parse(requestDto.getTargetDate()));
    reservation.setReservedTimeSlot(requestDto.getTimeSlot());
    reservation.setTotalAmount(requestDto.getTotalAmount());
    reservation.setDeposit(20000);

    if (status == ReservationStatus.PENDING) {
      reservation.setPaymentDueDate(LocalDateTime.now().plusDays(3));
    }

    log.info("새로운 예약이 '{}' 상태로 DB에 저장되었습니다.", status);
    return reservationRepository.save(reservation);
  }

}

