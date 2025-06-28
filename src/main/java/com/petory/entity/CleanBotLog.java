package com.petory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class CleanBotLog extends BaseTimeEntity{
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long targetId; // 처리한 댓글 또는 게시글의 ID

  @Column(nullable = false)
  private String targetType; // "COMMENT", "BOARD" 등

  private String detectedWord; // 감지된 특정 욕설

  @Lob
  private String originalContent; // 필터링 전 원본 내용
}
