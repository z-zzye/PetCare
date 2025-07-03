package com.petory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class WalkingTrail extends BaseEntity{
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "trailId")
  private Long id;

  @Column(name = "trailName", nullable = false)
  private String name;

  @Column(name = "trailDescription", length = 1000)
  private String description;

  @Lob
  @Column(name = "trailPathData", columnDefinition = "LONGTEXT")
  private String pathData;

  @Column(name = "trailDistance")
  private int distance;

  @Column(name = "estimatedTime")
  private int time;

  @Column(name = "mainImageUrl")
  private String mainImage;

  @Column(name = "trailRecommends", nullable = false)
  private int recommends = 0;

  @OneToMany(mappedBy = "walkingTrail", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<WalkingTrailComment> comments = new ArrayList<>();
}
