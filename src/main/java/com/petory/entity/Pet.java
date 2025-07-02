package com.petory.entity;

import com.petory.constant.Gender;
import com.petory.constant.Neutered;
import com.petory.constant.PetCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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
}
