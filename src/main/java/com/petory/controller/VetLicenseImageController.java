package com.petory.controller;

import com.petory.service.GoogleVisionService;
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
    
    private final GoogleVisionService googleVisionService;

    /**
     * 수의사 자격증 이미지 업로드
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadLicenseImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "analyze", defaultValue = "false") boolean analyze) {
        System.out.println("=== 이미지 업로드 컨트롤러 호출됨 ===");
        System.out.println("파일명: " + file.getOriginalFilename());
        System.out.println("파일 크기: " + file.getSize());
        
        try {
            // 파일 검증
            if (file.isEmpty()) {
                System.out.println("파일이 비어있음");
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

            // Google Vision AI로 자격증 정보 분석 (analyze 파라미터가 true일 때만)
            GoogleVisionService.VetLicenseInfo licenseInfo = null;
            if (analyze) {
                try {
                    System.out.println("=== Google Vision AI 분석 시작 ===");
                    System.out.println("파일명: " + file.getOriginalFilename());
                    System.out.println("파일 크기: " + file.getSize() + " bytes");
                    
                    licenseInfo = googleVisionService.analyzeVetLicense(file);
                    
                    System.out.println("=== Google Vision AI 분석 완료 ===");
                    if (licenseInfo != null) {
                        System.out.println("추출된 이름: " + licenseInfo.getName());
                        System.out.println("추출된 생년월일: " + licenseInfo.getBirthDate());
                        System.out.println("추출된 발급일: " + licenseInfo.getIssueDate());
                    }
                } catch (Exception e) {
                    // Vision AI 분석 실패 시에도 업로드는 성공으로 처리
                    System.err.println("=== Google Vision AI 분석 실패 ===");
                    System.err.println("오류 메시지: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("=== Google Vision AI 분석 건너뜀 (analyze=false) ===");
            }

            // 응답 데이터
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이미지 업로드가 완료되었습니다.");
            response.put("filename", newFilename);
            response.put("originalFilename", originalFilename);
            response.put("fileSize", file.getSize());
            
            // Vision AI 분석 결과 추가
            if (licenseInfo != null) {
                response.put("licenseInfo", licenseInfo);
                response.put("extractedName", licenseInfo.getName());
                response.put("extractedBirthDate", licenseInfo.getBirthDate());
                response.put("extractedIssueDate", licenseInfo.getIssueDate());
            }

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