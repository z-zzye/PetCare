package com.petory.repository;

import com.petory.constant.ReservationStatus;
import com.petory.entity.Pet;
import com.petory.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
  List<Reservation> findByPetAndReservationStatus(Pet pet, ReservationStatus status);
}
