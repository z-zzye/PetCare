package com.petory.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.petory.constant.ReservationStatus;
import com.petory.dto.autoReservation.AvailableSlotResponseDto;
import com.petory.dto.autoReservation.DetailedSlotSearchResponseDto;
import com.petory.dto.autoReservation.LocationDto;
import com.petory.dto.autoReservation.ReservationConfirmRequestDto;
import com.petory.dto.autoReservation.ReservationDetailDto;
import com.petory.dto.autoReservation.SlotSearchRequestDto;
import com.petory.dto.autoReservation.VaccineDateInfo;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import com.petory.repository.ReservationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

  private final ReservationRepository reservationRepository;
  private final AutoReservationService autoReservationService;
  private final RestTemplate restTemplate;
  private final NotificationService notificationService;

  /**
   * [1단계 기능] 특정 회원의 모든 예약 목록을 DTO로 변환하여 반환합니다.
   * ReservationController의 getMyReservations 메서드가 이 메서드를 호출합니다.
   *
   * @param memberId 현재 로그인한 회원의 ID
   * @return List<ReservationDetailDto>
   */
  @Transactional(readOnly = true)
  public List<ReservationDetailDto> findMyReservations(Long memberId) {
    log.info("회원 ID {}의 예약 목록을 조회합니다.", memberId);

    List<Reservation> reservations = reservationRepository.findByMemberReservations(memberId);

    return reservations.stream()
      .map(ReservationDetailDto::new) // Reservation -> ReservationDetailDto 변환
      .collect(Collectors.toList());
  }

  /**
   * 접종 완료 처리 및 다음 예약을 자동으로 생성합니다.
   * @param reservationId 완료 처리할 예약의 ID
   * @param userEmail     요청을 보낸 사용자의 이메일 (권한 확인용)
   */
  public void completeAndScheduleNext(Long reservationId, String userEmail) {
    log.info("예약 ID {}의 접종 완료 처리를 시작합니다. 요청자: {}", reservationId, userEmail);

    // 1. 현재 예약 완료 처리
    // 완료 처리할 예약을 찾아 소유권과 상태를 확인합니다.
    Reservation completedReservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

    if (!completedReservation.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("해당 예약에 대한 권한이 없습니다.");
    }
    if (completedReservation.getReservationStatus() != ReservationStatus.CONFIRMED) {
      throw new IllegalArgumentException("확정(CONFIRMED) 상태의 예약만 완료 처리할 수 있습니다.");
    }

    // 유효성 검증이 끝나면 상태를 COMPLETED로 변경합니다.
    completedReservation.setReservationStatus(ReservationStatus.COMPLETED);
    log.info("예약 ID: {} 상태를 COMPLETED로 변경했습니다.", reservationId);

    // 2. 다음 예약 대상 선정
    Pet pet = completedReservation.getPet();
    log.info("펫 ID {}의 다음 자동 예약을 시도합니다.", pet.getPet_Num());

    // 2-1. 펫에게 필요한 모든 다음 접종 후보와 각각의 예상 날짜를 계산합니다.
    List<VaccineDateInfo> allNextVaccineInfos = autoReservationService.calculateNextDatesForRebooking(pet);

    if (allNextVaccineInfos.isEmpty()) {
      log.info("펫 ID {}: 모든 필수 접종이 완료되어 다음 자동 예약을 생성하지 않습니다.", pet.getPet_Num());
      return;
    }

    // 2-2. 후보 중 가장 빠른 날짜를 기준으로, 해당 날짜에 함께 맞을 백신들을 그룹화합니다.
    LocalDate nextTargetDate = allNextVaccineInfos.get(0).getDate();
    List<String> vaccinesForThisAppointment = allNextVaccineInfos.stream()
      .filter(info -> info.getDate().equals(nextTargetDate))
      .map(VaccineDateInfo::getVaccineName)
      .collect(Collectors.toList());

    // 3. 다음 예약 장소 탐색
    // 3-1. 병원 탐색에 필요한 DTO를 생성하고, 펫의 선호 정보를 설정합니다.
    SlotSearchRequestDto searchDto = new SlotSearchRequestDto();
    searchDto.setPetId(pet.getPet_Num());
    searchDto.setVaccineTypes(vaccinesForThisAppointment);
    searchDto.setRadius(10.0);

    if (pet.getPreferredDaysOfWeek() != null && !pet.getPreferredDaysOfWeek().isEmpty()) {
      List<String> preferredDayNames = pet.getPreferredDaysOfWeek().stream()
        .map(DayOfWeek::name) // DayOfWeek.MONDAY -> "MONDAY"
        .toList();
      searchDto.setPreferredDays(preferredDayNames);
    } else {
      searchDto.setPreferredDays(List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"));
    }
    if (pet.getPreferredTime() != null && !pet.getPreferredTime().isEmpty()) {
      searchDto.setPreferredTime(pet.getPreferredTime());
    } else {
      searchDto.setPreferredTime("MORNING");
    }

    String address = pet.getMember().getMember_Address();
    if (address != null && address.contains(",")) {
        String[] parts = address.split(",");
        double lat = Double.parseDouble(parts[0]);
        double lng = Double.parseDouble(parts[1]);
        searchDto.setLocation(new LocationDto(lat, lng));
    } else {
        searchDto.setLocation(new LocationDto(37.4905, 126.7260));
    }

    // 3-2. 병원/슬롯을 탐색합니다.
    DetailedSlotSearchResponseDto searchResponse = autoReservationService.findAvailableSlots(searchDto);
    if (searchResponse.getAvailableSlots().isEmpty()) {
      log.warn("펫 ID {}: 다음 예약을 위한 병원을 찾지 못했습니다.", pet.getPet_Num());
      return;
    }

    // 4. 다음 예약 최종 결정 및 생성 ==========================================================
    // 4-1. 펫의 선호 병원을 기준으로 예약할 슬롯을 최종 결정합니다.
    String preferredHospitalId = pet.getPreferredHospital();
    Optional<AvailableSlotResponseDto> targetSlotOptional;

    if (preferredHospitalId != null && !preferredHospitalId.isEmpty()) {
      targetSlotOptional = searchResponse.getAvailableSlots().stream()
        .filter(slot -> slot.getHospitalId().equals(preferredHospitalId))
        .findFirst();
      if (targetSlotOptional.isEmpty()) {
        log.warn("펫 ID {}: 선호 병원(ID: {})에 예약 가능한 시간이 없어 다음 예약을 생성하지 못했습니다.", pet.getPet_Num(), preferredHospitalId);
        // TODO : 사용자에게 알림 발송 추후 추가
        return;
      }
    } else {
      targetSlotOptional = Optional.of(searchResponse.getAvailableSlots().get(0));
    }
    AvailableSlotResponseDto nextSlot = targetSlotOptional.get();

    // 4-2. 최종 결정된 슬롯과 백신 그룹으로 예약 확정 DTO를 생성합니다.
    int totalAmount = vaccinesForThisAppointment.stream()
      .mapToInt(vaccineName -> nextSlot.getPriceList().getOrDefault(vaccineName, 0))
      .sum();
    ReservationConfirmRequestDto confirmDto = new ReservationConfirmRequestDto();
    confirmDto.setPetId(pet.getPet_Num());
    confirmDto.setHospitalId(nextSlot.getHospitalId());
    confirmDto.setHospitalAddress(nextSlot.getAddress());
    confirmDto.setHospitalPhone(nextSlot.getPhone());
    confirmDto.setTargetDate(nextSlot.getTargetDate());
    confirmDto.setTimeSlot(nextSlot.getTimeSlot());
    confirmDto.setVaccineTypes(vaccinesForThisAppointment);
    confirmDto.setTotalAmount(totalAmount);

    // 4-3. 다음 예약을 실제로 생성합니다.
    Reservation nextReservation = autoReservationService.confirmAndPayReservation(confirmDto);
    log.info("펫 ID {}: 다음 자동 예약(병원: {})이 성공적으로 생성되었습니다.", pet.getPet_Num(), nextSlot.getHospitalName());

    // 5. 접종 완료 알림 생성
    try {
      notificationService.createAutoVaxCompleteNotification(
        completedReservation.getMember(),
        nextReservation.getId(),
        pet.getPet_Num(),
        pet.getPet_Name(),
        nextSlot.getHospitalName()
      );
    } catch (Exception e) {
      log.error("접종 완료 알림 생성 중 오류 발생: Reservation ID {}", completedReservation.getId(), e);
      // 알림 생성 실패가 접종 완료 처리를 막지 않도록 예외를 던지지 않음
    }
  }

  public void cancelByUser(Long reservationId, String userEmail) {
    log.info("예약 ID {}의 '사용자' 취소 처리를 시작합니다. 요청자: {}", reservationId, userEmail);
    Reservation reservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

    // ✅ [핵심] 요청자와 예약의 주인이 같은지 '소유권'을 확인합니다.
    if (!reservation.getMember().getMember_Email().equals(userEmail)) {
      throw new SecurityException("예약을 취소할 권한이 없습니다.");
    }

    // 공통 취소 로직 호출
    processCancellation(reservation);
  }


  /**
   * [수정] 병원(관리자)의 요청으로 예약을 취소합니다.
   * @param reservationId 취소할 예약의 ID
   * @param adminEmail    요청자의 이메일 (로그 기록용)
   */
  public void cancelByClinic(Long reservationId, String adminEmail) {
    log.info("예약 ID {}의 '관리자' 취소 처리를 시작합니다. 요청자: {}", adminEmail);
    Reservation reservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

    // ✅ [핵심] 관리자/병원은 소유권 검사를 하지 않습니다.
    // TODO: 추후 adminEmail이 실제로 ADMIN/VET 권한을 가졌는지 확인하는 로직 추가 가능

    // 공통 취소 로직 호출
    processCancellation(reservation);
  }

  /**
   * [신규-private] 중복되는 취소 처리 로직을 공통 메서드로 분리합니다.
   * @param reservation 취소할 Reservation 객체
   */
  private void processCancellation(Reservation reservation) {
    // 1. 취소 가능한 상태인지 확인
    ReservationStatus status = reservation.getReservationStatus();
    if (status == ReservationStatus.COMPLETED || status == ReservationStatus.CANCELED) {
      throw new IllegalArgumentException("이미 완료되었거나 취소된 예약은 취소할 수 없습니다.");
    }

    // 2. 더미 서버에 슬롯 반환 요청
    String url = "http://localhost:3001/api/hospitals/cancel-slot";
    try {
      Map<String, String> requestBody = Map.of(
        "hospitalId", reservation.getReservedHospitalId(),
        "targetDate", reservation.getReservedDate().toString(),
        "timeSlot", reservation.getReservedTimeSlot()
      );
      restTemplate.postForEntity(url, requestBody, Map.class);
      log.info("더미 서버의 슬롯(ID: {})을 성공적으로 반환했습니다.", reservation.getReservedHospitalId());
    } catch (Exception e) {
      log.error("더미 서버 슬롯 취소 요청 실패: Reservation ID {}", reservation.getId(), e);
    }

    // 3. 우리 DB 상태를 CANCELED로 변경
    reservation.setReservationStatus(ReservationStatus.CANCELED);
    log.info("예약 ID: {} 상태를 CANCELED로 변경했습니다.", reservation.getId());

    // 4. 알림 생성
    try {
      notificationService.createAutoVaxCancelNotification(
        reservation.getMember(),
        reservation.getId(),
        reservation.getPet().getPet_Num(),
        reservation.getPet().getPet_Name(),
        reservation.getHospitalName()
      );
    } catch (Exception e) {
      log.error("알림 생성 중 오류 발생: Reservation ID {}", reservation.getId(), e);
      // 알림 생성 실패가 예약 취소를 막지 않도록 예외를 던지지 않음
    }
  }

  /**
   * 관리자용: 모든 자동 예약 목록 조회
   */
  @Transactional(readOnly = true)
  public List<ReservationDetailDto> getAllAutoVaxReservations() {
    log.info("관리자용 자동 예약 목록을 조회합니다.");
    
    List<Reservation> reservations = reservationRepository.findAll();
    
    return reservations.stream()
      .map(ReservationDetailDto::new)
      .collect(Collectors.toList());
  }

  /**
   * 관리자용: 예약 상태 변경
   */
  public void updateReservationStatusByAdmin(Long reservationId, String newStatus) {
    log.info("관리자가 예약 ID {}의 상태를 {}로 변경합니다.", reservationId, newStatus);
    
    Reservation reservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));
    
    ReservationStatus status;
    try {
      status = ReservationStatus.valueOf(newStatus.toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("유효하지 않은 상태값입니다: " + newStatus);
    }
    
    // 완료 처리인 경우 관리자용 완료 처리 메서드 호출
    if (status == ReservationStatus.COMPLETED) {
      completeAndScheduleNextByAdmin(reservationId);
      return;
    }
    
    // 취소 처리인 경우
    if (status == ReservationStatus.CANCELED) {
      // 이전 상태 저장
      ReservationStatus previousStatus = reservation.getReservationStatus();
      
      // 상태 변경
      reservation.setReservationStatus(status);
      log.info("예약 ID: {} 상태를 {}에서 {}로 변경했습니다.", reservationId, previousStatus, status);
      
      // 취소 알림 생성
      try {
        notificationService.createAutoVaxCancelNotification(
          reservation.getMember(),
          reservation.getId(),
          reservation.getPet().getPet_Num(),
          reservation.getPet().getPet_Name(),
          reservation.getHospitalName()
        );
      } catch (Exception e) {
        log.error("상태 변경 알림 생성 중 오류 발생: Reservation ID {}", reservationId, e);
        // 알림 생성 실패가 상태 변경을 막지 않도록 예외를 던지지 않음
      }
    }
  }

  /**
   * 관리자용: 완료 처리 및 다음 예약 생성 (권한 체크 없음)
   */
  private void completeAndScheduleNextByAdmin(Long reservationId) {
    log.info("관리자가 예약 ID {}의 접종 완료 처리를 시작합니다.", reservationId);

    // 1. 현재 예약 완료 처리
    Reservation completedReservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

    // 관리자는 권한 체크 없이 상태만 확인
    if (completedReservation.getReservationStatus() != ReservationStatus.CONFIRMED && 
        completedReservation.getReservationStatus() != ReservationStatus.PENDING) {
      throw new IllegalArgumentException("확정(CONFIRMED) 또는 대기중(PENDING) 상태의 예약만 완료 처리할 수 있습니다.");
    }

    // 유효성 검증이 끝나면 상태를 COMPLETED로 변경합니다.
    completedReservation.setReservationStatus(ReservationStatus.COMPLETED);
    log.info("예약 ID: {} 상태를 COMPLETED로 변경했습니다.", reservationId);

    // 2. 다음 예약 대상 선정
    Pet pet = completedReservation.getPet();
    log.info("펫 ID {}의 다음 자동 예약을 시도합니다.", pet.getPet_Num());

    // 2-1. 펫에게 필요한 모든 다음 접종 후보와 각각의 예상 날짜를 계산합니다.
    List<VaccineDateInfo> allNextVaccineInfos = autoReservationService.calculateNextDatesForRebooking(pet);

    if (allNextVaccineInfos.isEmpty()) {
      log.info("펫 ID {}: 모든 필수 접종이 완료되어 다음 자동 예약을 생성하지 않습니다.", pet.getPet_Num());
      return;
    }

    // 2-2. 후보 중 가장 빠른 날짜를 기준으로, 해당 날짜에 함께 맞을 백신들을 그룹화합니다.
    LocalDate nextTargetDate = allNextVaccineInfos.get(0).getDate();
    List<String> vaccinesForThisAppointment = allNextVaccineInfos.stream()
      .filter(info -> info.getDate().equals(nextTargetDate))
      .map(VaccineDateInfo::getVaccineName)
      .collect(Collectors.toList());

    // 3. 다음 예약 장소 탐색
    // 3-1. 병원 탐색에 필요한 DTO를 생성하고, 펫의 선호 정보를 설정합니다.
    SlotSearchRequestDto searchDto = new SlotSearchRequestDto();
    searchDto.setPetId(pet.getPet_Num());
    searchDto.setVaccineTypes(vaccinesForThisAppointment);
    searchDto.setRadius(10.0);

    if (pet.getPreferredDaysOfWeek() != null && !pet.getPreferredDaysOfWeek().isEmpty()) {
      List<String> preferredDayNames = pet.getPreferredDaysOfWeek().stream()
        .map(DayOfWeek::name) // DayOfWeek.MONDAY -> "MONDAY"
        .toList();
      searchDto.setPreferredDays(preferredDayNames);
    } else {
      searchDto.setPreferredDays(List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"));
    }
    if (pet.getPreferredTime() != null && !pet.getPreferredTime().isEmpty()) {
      searchDto.setPreferredTime(pet.getPreferredTime());
    } else {
      searchDto.setPreferredTime("MORNING");
    }

    String address = pet.getMember().getMember_Address();
    if (address != null && address.contains(",")) {
        String[] parts = address.split(",");
        double lat = Double.parseDouble(parts[0]);
        double lng = Double.parseDouble(parts[1]);
        searchDto.setLocation(new LocationDto(lat, lng));
    } else {
        searchDto.setLocation(new LocationDto(37.4905, 126.7260));
    }

    // 3-2. 병원/슬롯을 탐색합니다.
    DetailedSlotSearchResponseDto searchResponse = autoReservationService.findAvailableSlots(searchDto);
    if (searchResponse.getAvailableSlots().isEmpty()) {
      log.warn("펫 ID {}: 다음 예약을 위한 병원을 찾지 못했습니다.", pet.getPet_Num());
      return;
    }

    // 4. 다음 예약 최종 결정 및 생성
    // 4-1. 펫의 선호 병원을 기준으로 예약할 슬롯을 최종 결정합니다.
    String preferredHospitalId = pet.getPreferredHospital();
    Optional<AvailableSlotResponseDto> targetSlotOptional;

    if (preferredHospitalId != null && !preferredHospitalId.isEmpty()) {
      targetSlotOptional = searchResponse.getAvailableSlots().stream()
        .filter(slot -> slot.getHospitalId().equals(preferredHospitalId))
        .findFirst();
      if (targetSlotOptional.isEmpty()) {
        log.warn("펫 ID {}: 선호 병원(ID: {})에 예약 가능한 시간이 없어 다음 예약을 생성하지 못했습니다.", pet.getPet_Num(), preferredHospitalId);
        return;
      }
    } else {
      targetSlotOptional = Optional.of(searchResponse.getAvailableSlots().get(0));
    }
    AvailableSlotResponseDto nextSlot = targetSlotOptional.get();

    // 4-2. 최종 결정된 슬롯과 백신 그룹으로 예약 확정 DTO를 생성합니다.
    int totalAmount = vaccinesForThisAppointment.stream()
      .mapToInt(vaccineName -> nextSlot.getPriceList().getOrDefault(vaccineName, 0))
      .sum();
    ReservationConfirmRequestDto confirmDto = new ReservationConfirmRequestDto();
    confirmDto.setPetId(pet.getPet_Num());
    confirmDto.setHospitalId(nextSlot.getHospitalId());
    confirmDto.setHospitalAddress(nextSlot.getAddress());
    confirmDto.setHospitalPhone(nextSlot.getPhone());
    confirmDto.setTargetDate(nextSlot.getTargetDate());
    confirmDto.setTimeSlot(nextSlot.getTimeSlot());
    confirmDto.setVaccineTypes(vaccinesForThisAppointment);
    confirmDto.setTotalAmount(totalAmount);

    // 4-3. 다음 예약을 실제로 생성합니다.
    Reservation nextReservation = autoReservationService.confirmAndPayReservation(confirmDto);
    log.info("펫 ID {}: 다음 자동 예약(병원: {})이 성공적으로 생성되었습니다.", pet.getPet_Num(), nextSlot.getHospitalName());

    // 5. 접종 완료 알림 생성
    try {
      notificationService.createAutoVaxCompleteNotification(
        completedReservation.getMember(),
        nextReservation.getId(),
        pet.getPet_Num(),
        pet.getPet_Name(),
        nextSlot.getHospitalName()
      );
    } catch (Exception e) {
      log.error("접종 완료 알림 생성 중 오류 발생: Reservation ID {}", completedReservation.getId(), e);
      // 알림 생성 실패가 접종 완료 처리를 막지 않도록 예외를 던지지 않음
    }
  }
}
