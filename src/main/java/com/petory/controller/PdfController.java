package com.petory.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    @GetMapping("/guide/{animalType}")
    public ResponseEntity<Resource> downloadGuide(@PathVariable String animalType) {
        try {
            System.out.println("PDF 다운로드 요청: " + animalType);
            
            // PDF 파일 경로 설정
            String fileName;
            switch (animalType.toLowerCase()) {
                case "dog":
                case "강아지":
                case "개":
                case "견":
                    fileName = "BasicGuide(Dog).pdf";
                    break;
                case "cat":
                case "고양이":
                case "묘":
                case "캣":
                    fileName = "BasicGuide(Cat).pdf";
                    break;
                default:
                    System.out.println("지원하지 않는 동물 타입: " + animalType);
                    return ResponseEntity.notFound().build();
            }

            System.out.println("파일명: " + fileName);

            // 파일 경로 설정 (static/guide/ 디렉토리)
            Path filePath = Paths.get("src/main/resources/static/guide/" + fileName);
            System.out.println("파일 경로: " + filePath.toAbsolutePath());
            System.out.println("파일 존재 여부: " + filePath.toFile().exists());
            
            // 개발 환경에서는 절대 경로로도 시도
            if (!filePath.toFile().exists()) {
                filePath = Paths.get(System.getProperty("user.dir"), "src/main/resources/static/guide/" + fileName);
                System.out.println("절대 경로 시도: " + filePath.toAbsolutePath());
                System.out.println("절대 경로 파일 존재 여부: " + filePath.toFile().exists());
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            System.out.println("리소스 존재 여부: " + resource.exists());
            System.out.println("리소스 읽기 가능 여부: " + resource.isReadable());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
            } else {
                System.out.println("파일을 찾을 수 없거나 읽을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            System.out.println("URL 오류: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 