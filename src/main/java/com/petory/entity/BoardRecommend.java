package com.petory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "board_recommend",
  uniqueConstraints = {
    @UniqueConstraint(
      name = "recommend_uk",
      columnNames = {"member_id", "post_id"}
    )
  }
)
public class BoardRecommend {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", nullable = false)
  private Board board;
}
