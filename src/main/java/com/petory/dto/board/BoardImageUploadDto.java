package com.petory.dto.board;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardImageUploadDto {
    
    private String originalFileName; // 원본 파일명
    private String storedFileName; // 저장된 파일명
    private String fileUrl; // 접근 가능한 URL
    private Long fileSize; // 파일 크기
    private String contentType; // MIME 타입
    private Integer displayOrder; // 표시 순서
    
    // 성공/실패 여부
    private boolean success;
    private String errorMessage; // 에러 메시지
} 