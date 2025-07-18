package com.petory.dto.board;

import com.petory.entity.BoardImage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardImageDto {
    
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String fileUrl;
    private Long fileSize;
    private String contentType;
    private Integer displayOrder;
    
    public static BoardImageDto from(BoardImage boardImage) {
        return BoardImageDto.builder()
                .id(boardImage.getId())
                .originalFileName(boardImage.getOriginalFileName())
                .storedFileName(boardImage.getStoredFileName())
                .fileUrl(boardImage.getFileUrl())
                .fileSize(boardImage.getFileSize())
                .contentType(boardImage.getContentType())
                .displayOrder(boardImage.getDisplayOrder())
                .build();
    }
} 