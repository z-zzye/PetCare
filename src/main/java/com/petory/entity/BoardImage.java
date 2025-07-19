package com.petory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Board board;

    @Column(nullable = false)
    private String originalFileName; // 원본 파일명

    @Column(nullable = false)
    private String storedFileName; // 저장된 파일명 (UUID)

    @Column(nullable = false)
    private String filePath; // 파일 경로

    @Column(nullable = false)
    private String fileUrl; // 접근 가능한 URL

    @Column(nullable = false)
    private Long fileSize; // 파일 크기 (bytes)

    @Column(nullable = false)
    private String contentType; // MIME 타입 (image/jpeg, image/png 등)

    @Column(nullable = false)
    private Integer displayOrder; // 이미지 표시 순서
} 