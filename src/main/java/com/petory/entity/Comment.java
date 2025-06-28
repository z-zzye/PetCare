package com.petory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class Comment extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "comment_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id") // Board 엔티티와 다대일 관계
  private Board board;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id") // Member 엔티티와 다대일 관계
  private Member member;

  @Lob
  @Column(nullable = false)
  private String content;

  private boolean blinded = false; // 클린봇에 의한 블라인드 여부
  @Lob
  private String originalContent; // 블라인드 처리 시 원본 내용 보관용 필드
}
