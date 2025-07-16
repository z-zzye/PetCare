package com.petory.entity;

import com.petory.constant.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
public class Pet {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long pet_Num;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  @Column(nullable = false)
  private String pet_Name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Gender pet_Gender;

  @Column(nullable = false)
  private LocalDate pet_Birth;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Neutered isNeutered;

  private String pet_ProfileImg;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PetCategory pet_Category;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AutoVaxStatus autoVaxStatus;

  // 자동 예약 시 저장되는 필드
  private String managedVaccineTypes; // 접종 종류
  private String preferredHospital; // 접종받을 병원
  private String preferredTime; // 선호 시간대(오전, 오후, 저녁)
  @ElementCollection(targetClass = DayOfWeek.class, fetch = FetchType.LAZY)
  @CollectionTable(name = "pet_preferred_days", joinColumns = @JoinColumn(name = "pet_num"))
  @Enumerated(EnumType.STRING) // Enum 이름을 문자열로 저장
  @Column(name = "day_of_week")
  private Set<DayOfWeek> preferredDaysOfWeek = new HashSet<>();

  @OneToMany(mappedBy = "pet", cascade = CascadeType.REMOVE, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<Reservation> reservations = new ArrayList<>();
}
