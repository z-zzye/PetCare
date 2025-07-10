package com.petory.repository;

import com.petory.constant.ReservationStatus;
import com.petory.entity.Member;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

  List<Reservation> findByPetAndReservationStatus(Pet pet, ReservationStatus status);

  // 펫과 예약 상태로 조회하되, 예약일시(reservationDateTime)를 기준으로 가장 최근의 결과 1개만 가져옵니다.
  Optional<Reservation> findTopByPetAndReservationStatusOrderByReservationDateTimeDesc(Pet pet, ReservationStatus status);

  // 특정 상태이면서, 결제 마감 기한이 특정 시간 이전인 예약들을 모두 찾습니다.
  List<Reservation> findByReservationStatusAndPaymentDueDateBefore(ReservationStatus status, LocalDateTime now);

  // 특정 Pet 엔티티와 연결된 모든 Reservation을 찾습니다.
  List<Reservation> findByPet(Pet pet);

  //
  @Query("SELECT r FROM Reservation r JOIN r.member m WHERE m.member_Id = :memberId ORDER BY r.reservationDateTime DESC")
  List<Reservation> findByMemberReservations(Long memberId);
}
