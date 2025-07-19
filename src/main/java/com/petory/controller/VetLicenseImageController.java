package com.petory.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vet-license-image")
public class VetLicenseImageController {

    @Value("${vetlicense.location:C:/petory/vetlicense/}")
    private String uploadPath;

    /**
     * 수의사 자격증 이미지 업로드
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadLicenseImage(@RequestParam("file") MultipartFile file) {
        try {
            // 파일 검증
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "파일이 선택되지 않았습니다."));
            }

            // 파일 확장자 검증
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !isValidImageFile(originalFilename)) {
                return ResponseEntity.badRequest().body(Map.of("error", "이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, gif)"));
            }

            // 파일 크기 검증 (5MB 제한)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "파일 크기는 5MB 이하여야 합니다."));
            }

            // 업로드 디렉토리 생성
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 파일명 생성 (중복 방지)
            String fileExtension = getFileExtension(originalFilename);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String uuid = UUID.randomUUID().toString().substring(0, 8);
            String newFilename = "vet_license_" + timestamp + "_" + uuid + "." + fileExtension;

            // 파일 저장
            Path filePath = Paths.get(uploadPath, newFilename);
            Files.copy(file.getInputStream(), filePath);

            // 응답 데이터
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이미지 업로드가 완료되었습니다.");
            response.put("filename", newFilename);
            response.put("originalFilename", originalFilename);
            response.put("fileSize", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "파일 업로드 중 오류가 발생했습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "알 수 없는 오류가 발생했습니다."));
        }
    }

    /**
     * 이미지 파일 확장자 검증
     */
    private boolean isValidImageFile(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals("jpg") || extension.equals("jpeg") || 
               extension.equals("png") || extension.equals("gif");
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex + 1);
        }
        return "";
    }
} 