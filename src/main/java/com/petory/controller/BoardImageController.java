package com.petory.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.petory.dto.board.BoardImageUploadDto;
import com.petory.entity.Board;
import com.petory.entity.BoardImage;
import com.petory.repository.BoardImageRepository;
import com.petory.repository.BoardRepository;

@RestController
@RequestMapping("/api/board-images")
public class BoardImageController {

    @Value("${file.upload.path:/uploads/board-images}")
    private String uploadPath;

    private final BoardImageRepository boardImageRepository;
    private final BoardRepository boardRepository;

    public BoardImageController(BoardImageRepository boardImageRepository, BoardRepository boardRepository) {
        this.boardImageRepository = boardImageRepository;
        this.boardRepository = boardRepository;
    }

    /**
     * 게시글 이미지 업로드
     */
    @PostMapping("/upload")
    public ResponseEntity<BoardImageUploadDto> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("boardId") Long boardId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // 게시글 존재 확인
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

            // 작성자 본인 확인
            if (!board.getMember().getMember_Email().equals(userDetails.getUsername())) {
                return ResponseEntity.badRequest().body(
                    BoardImageUploadDto.builder()
                        .success(false)
                        .errorMessage("게시글을 수정할 권한이 없습니다.")
                        .build()
                );
            }

            // 파일 검증
            String validationError = validateFile(file);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(
                    BoardImageUploadDto.builder()
                        .success(false)
                        .errorMessage(validationError)
                        .build()
                );
            }

            // 업로드 디렉토리 생성
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 고유한 파일명 생성
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            String storedFileName = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadDir.resolve(storedFileName);

            // 파일 저장
            Files.copy(file.getInputStream(), filePath);

            // 파일 URL 생성
            String fileUrl = "/uploads/board-images/" + storedFileName;

            // 다음 displayOrder 계산
            Integer nextDisplayOrder = boardImageRepository.findMaxDisplayOrderByBoardId(boardId);
            if (nextDisplayOrder == null) {
                nextDisplayOrder = 1;
            } else {
                nextDisplayOrder++;
            }

            // BoardImage 엔티티 생성 및 저장
            BoardImage boardImage = BoardImage.builder()
                    .board(board)
                    .originalFileName(originalFilename)
                    .storedFileName(storedFileName)
                    .filePath(filePath.toString())
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .displayOrder(nextDisplayOrder)
                    .build();

            boardImageRepository.save(boardImage);

            // 성공 응답
            BoardImageUploadDto response = BoardImageUploadDto.builder()
                    .originalFileName(originalFilename)
                    .storedFileName(storedFileName)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .displayOrder(nextDisplayOrder)
                    .success(true)
                    .build();

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(
                BoardImageUploadDto.builder()
                    .success(false)
                    .errorMessage("파일 업로드 중 오류가 발생했습니다: " + e.getMessage())
                    .build()
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                BoardImageUploadDto.builder()
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }

    /**
     * 게시글 이미지 삭제
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<String> deleteImage(
            @PathVariable Long imageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            BoardImage boardImage = boardImageRepository.findById(imageId)
                    .orElseThrow(() -> new IllegalArgumentException("해당 이미지를 찾을 수 없습니다."));

            // 작성자 본인 확인
            if (!boardImage.getBoard().getMember().getMember_Email().equals(userDetails.getUsername())) {
                return ResponseEntity.badRequest().body("이미지를 삭제할 권한이 없습니다.");
            }

            // 파일 시스템에서 파일 삭제
            Path filePath = Paths.get(boardImage.getFilePath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }

            // DB에서 이미지 정보 삭제
            boardImageRepository.delete(boardImage);

            return ResponseEntity.ok("이미지가 성공적으로 삭제되었습니다.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("파일 삭제 중 오류가 발생했습니다: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 파일 검증
     */
    private String validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            return "업로드할 파일을 선택해주세요.";
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            return "파일명이 없습니다.";
        }

        // 파일 확장자 검증
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!fileExtension.matches("\\.(jpg|jpeg|png|gif|webp)$")) {
            return "지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp만 가능)";
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.getSize() > 5 * 1024 * 1024) {
            return "파일 크기는 5MB 이하여야 합니다.";
        }

        return null; // 검증 통과
    }
} 