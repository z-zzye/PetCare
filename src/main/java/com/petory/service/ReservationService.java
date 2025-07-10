package com.petory.service;

import com.petory.constant.ReservationStatus;
import com.petory.dto.autoReservation.ReservationDetailDto; // 이전 단계에서 만든 DTO
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import com.petory.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

  private final ReservationRepository reservationRepository;
  // ✅ [중요] 나중에 '다음 예약 생성'을 위해 AutoReservationService도 주입받게 됩니다.
  private final AutoReservationService autoReservationService;

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
   * [2단계 기능] 특정 예약을 '접종 완료' 처리하고, 다음 회차 예약을 자동으로 생성합니다.
   *
   * @param reservationId 완료 처리할 예약의 ID
   */
  public void completeAndScheduleNext(Long reservationId) {
    log.info("예약 ID {}의 접종 완료 처리를 시작합니다.", reservationId);

    // 1. 현재 예약을 DB에서 찾아 'COMPLETED' 상태로 변경
    Reservation completedReservation = reservationRepository.findById(reservationId)
      .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

    completedReservation.setReservationStatus(ReservationStatus.COMPLETED);
    log.info("예약 ID: {} 상태를 COMPLETED로 변경했습니다.", reservationId);

    // --- 다음 자동 예약 생성 로직 ---
    Pet pet = completedReservation.getPet();
    log.info("펫 ID {}의 다음 자동 예약을 시도합니다.", pet.getPet_Num());

    // TODO: 2단계에서 이 부분을 구체화합니다.
    // 1. 이 펫이 다음에 맞아야 할 백신과 날짜를 계산합니다. (calculateNextVaccineDateInfos 로직 활용)
    // 2. 계산된 정보로 예약 가능한 병원을 탐색합니다. (autoReservationService.findAvailableSlots 호출)
    // 3. 탐색된 병원 정보로 다음 예약을 확정합니다. (autoReservationService.confirmAndPayReservation 호출)

    log.info("접종 완료 및 다음 예약 생성 프로세스가 완료되었습니다.");
  }

}
