package com.petory.entity;

import com.petory.constant.BoardKind;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class Board extends BaseEntity { // BaseTimeEntity가 @CreatedDate, @LastModifiedDate를 가짐

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "post_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
  @JoinColumn(name = "member_id") // DB의 member_id 컬럼과 매핑
  private Member member; // Member 엔티티와 다대일 관계

  @Column(nullable = false)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BoardKind boardKind; // 게시판 종류 (ENUM 타입)

  @Lob // 대용량 텍스트를 위한 어노테이션
  @Column(nullable = false)
  private String content;

  @Column(columnDefinition = "integer default 0", nullable = false)
  private int viewCount;

  @Column(columnDefinition = "integer default 0", nullable = false)
  private int commentCount; // ripleCount -> commentCount로 변경

  @Column(columnDefinition = "integer default 0", nullable = false)
  private int likeCount;

  private String hashTag;

  private boolean blinded = false; // 클린봇에 의한 블라인드 여부

  @Lob
  private String originalContent; // 블라인드 처리 시 원본 내용 보관용 필드
}
