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
import java.util.function.Function;
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

    // 1. 먼저 펫에게 필요한 모든 다음 접종 정보를 계산합니다.
    List<VaccineDateInfo> vaccineDates = calculateNextDatesForForm(pet, requestDto.getVaccineTypes());

    if (vaccineDates.isEmpty()) {
      log.info("선택된 백신 중 예약할 회차가 남아있는 항목이 없습니다.");
      return new DetailedSlotSearchResponseDto(Collections.emptyList(), Collections.emptyList());
    }

    // 3. 필터링된 결과 중 가장 빠른 날짜를 찾습니다.
    LocalDate overallEarliestDate = vaccineDates.stream()
      .min(Comparator.comparing(VaccineDateInfo::getDate))
      .get()
      .getDate();

    // 4. 가장 빠른 날짜로 병원을 조회하고 결과를 반환합니다.
    List<AvailableSlotResponseDto> availableSlots = findHospitalsForDate(overallEarliestDate, requestDto);
    return new DetailedSlotSearchResponseDto(vaccineDates, availableSlots);
  }

  /**
   * ✅ [역할 2: 자동 재예약] '접종 완료' 후 다음 예약을 생성할 때 사용됩니다.
   */
  public List<VaccineDateInfo> calculateNextDatesForRebooking(Pet pet) {
    // 펫 엔티티에 저장된 관리 대상 백신 목록을 가져옵니다.
    String managedTypesString = pet.getManagedVaccineTypes();
    if (managedTypesString == null || managedTypesString.isEmpty()) {
      return Collections.emptyList();
    }
    List<String> managedVaccineNames = Arrays.asList(managedTypesString.split(","));

    // 공통 계산 로직을 호출합니다.
    return calculateNextDates(pet, managedVaccineNames);
  }

  /**
   * ✅ [신규-private] '최초 예약 폼'을 위한 날짜 계산 헬퍼 메서드
   */
  private List<VaccineDateInfo> calculateNextDatesForForm(Pet pet, List<String> selectedVaccineNames) {
    // 공통 계산 로직을 호출합니다.
    return calculateNextDates(pet, selectedVaccineNames);
  }

  /**
   * ✅ [신규-private] '날짜 계산'이라는 핵심 로직을 담당하는 공통 메서드
   */
  private List<VaccineDateInfo> calculateNextDates(Pet pet, List<String> targetVaccineNames) {
    Map<VaccineType, Long> completedCounts = getCompletedCounts(pet);
    Optional<Reservation> lastCompleted = reservationRepository.findTopByPetAndReservationStatusOrderByReservationDateTimeDesc(pet, ReservationStatus.COMPLETED);

    return targetVaccineNames.stream()
      .map(VaccineType::valueOf)
      .filter(vaccine -> completedCounts.getOrDefault(vaccine, 0L) < vaccine.getTotalShots())
      .map(vaccine -> {
        long alreadyDone = completedCounts.getOrDefault(vaccine, 0L);
        LocalDate idealDate = pet.getPet_Birth().plusWeeks(vaccine.getStartWeeks()).plusWeeks(alreadyDone * vaccine.getIntervalWeeks());
        LocalDate today = LocalDate.now();
        LocalDate minGracePeriodDate = today.plusWeeks(1); // 규칙A: 최소 1주일의 준비 기간
        LocalDate minIntervalDate = lastCompleted.map(r -> r.getReservationDateTime().toLocalDate().plusWeeks(3)).orElse(today); // 규칙B: 마지막 접종일로부터 최소 3주 간격
        LocalDate earliestPossibleDate = minGracePeriodDate.isAfter(minIntervalDate) ? minGracePeriodDate : minIntervalDate; // 두 규칙 중 더 나중 날짜 선택
        LocalDate finalDate = idealDate.isBefore(earliestPossibleDate) ? earliestPossibleDate : idealDate; // 최종 예약 가능일 조정
        return new VaccineDateInfo(vaccine.name(), vaccine.getDescription(), finalDate);
      })
      .sorted(Comparator.comparing(VaccineDateInfo::getDate))
      .collect(Collectors.toList());
  }

  /**
   * [공통-private] 완료된 접종 횟수를 계산하는 헬퍼 메서드
   */
  private Map<VaccineType, Long> getCompletedCounts(Pet pet) {
    return reservationRepository.findByPetAndReservationStatus(pet, ReservationStatus.COMPLETED).stream()
      .map(Reservation::getVaccineTypes)
      .filter(Objects::nonNull)
      .flatMap(names -> Arrays.stream(names.split(",")))
      .map(String::trim)
      .filter(name -> !name.isEmpty())
      .map(this::getVaccineTypeOrNull)
      .filter(Objects::nonNull)
      .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
  }

  private VaccineType getVaccineTypeOrNull(String name) {
    try {
      return VaccineType.valueOf(name);
    } catch (IllegalArgumentException e) {
      log.warn("DB에 알 수 없는 백신 이름({})이 저장되어 있어 계산에서 제외합니다.", name);
      return null;
    }
  }

  /**
   * 특정 시작일과 선호 요일을 기준으로 예약 가능한 병원을 탐색하는 헬퍼 메서드
   */
  private List<AvailableSlotResponseDto> findHospitalsForDate(LocalDate earliestDate, SlotSearchRequestDto requestDto) {
    List<String> preferredDayNames = requestDto.getPreferredDays();
    if (preferredDayNames == null || preferredDayNames.isEmpty()) {
      throw new IllegalArgumentException("선호 요일을 하나 이상 선택해야 합니다.");
    }

    List<DayOfWeek> preferredDays = preferredDayNames.stream()
      .map(String::toUpperCase) // 소문자가 들어올 경우를 대비해 대문자로 변경
      .map(DayOfWeek::valueOf)
      .toList();

    for (int i = 0; i < 8; i++) { // 최대 8주까지 탐색
      final LocalDate currentSearchWeekStart = earliestDate.plusWeeks(i);

      // 정렬된 선호 요일 목록을 순회하며 가장 빠른 슬롯을 찾는다.
      List<LocalDate> potentialQueryDates = preferredDays.stream()
        .map(day -> currentSearchWeekStart.with(TemporalAdjusters.nextOrSame(day)))
        .sorted()
        .toList();

      for (LocalDate queryDate : potentialQueryDates) {
        String url = UriComponentsBuilder.fromUriString("http://localhost:3001/api/hospitals/check-availability")
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
      String vaccineNamesAsString = String.join(",", requestDto.getVaccineTypes());
      reservation.setVaccineTypes(vaccineNamesAsString);
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

