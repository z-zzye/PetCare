package com.petory.repository;

import com.petory.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {
  @Query("SELECT p FROM Pet p WHERE p.member.member_Id = :memberId")
  List<Pet> findByMemberId(@Param("memberId") Long memberId);
}
