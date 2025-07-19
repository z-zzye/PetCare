package com.petory.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GoogleVisionService {

    @Value("${google.cloud.vision.credentials.path:classpath:google-credentials.json}")
    private String credentialsPath;
    
    private final ResourceLoader resourceLoader;
    
    public GoogleVisionService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * 이미지에서 텍스트를 추출합니다.
     */
    public String extractTextFromImage(MultipartFile file) throws IOException {
        // Google Cloud 인증 정보 로드
        log.info("Google Cloud 인증 정보 로드 시작");
        log.info("Credentials path: {}", credentialsPath);
        
        try {
            Resource resource = resourceLoader.getResource(credentialsPath);
            log.info("Resource exists: {}", resource.exists());
            
            GoogleCredentials credentials = GoogleCredentials.fromStream(resource.getInputStream());
            log.info("Google Credentials 로드 완료");
            
                        try (ImageAnnotatorClient client = ImageAnnotatorClient.create(ImageAnnotatorSettings.newBuilder()
                    .setCredentialsProvider(() -> credentials)
                    .build())) {
                
                // 이미지 데이터를 ByteString으로 변환
                ByteString imgBytes = ByteString.copyFrom(file.getBytes());
                
                // 이미지 객체 생성
                Image img = Image.newBuilder().setContent(imgBytes).build();
                
                // OCR 요청 생성
                Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
                AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                        .addFeatures(feat)
                        .setImage(img)
                        .build();
                
                // Vision API 호출
                BatchAnnotateImagesResponse response = client.batchAnnotateImages(
                        List.of(request));
                
                // 결과 처리
                List<AnnotateImageResponse> responses = response.getResponsesList();
                
                if (responses.isEmpty()) {
                    log.warn("Vision API 응답이 비어있습니다.");
                    return "";
                }
                
                AnnotateImageResponse res = responses.get(0);
                if (res.hasError()) {
                    log.error("Vision API 오류: {}", res.getError().getMessage());
                    throw new RuntimeException("Vision API 오류: " + res.getError().getMessage());
                }
                
                // 추출된 텍스트 반환
                StringBuilder extractedText = new StringBuilder();
                for (EntityAnnotation annotation : res.getTextAnnotationsList()) {
                    extractedText.append(annotation.getDescription()).append("\n");
                }
                
                log.info("추출된 텍스트: {}", extractedText.toString());
                return extractedText.toString();
                
            }
        } catch (Exception e) {
            log.error("Vision API 호출 중 오류 발생", e);
            throw new RuntimeException("이미지 텍스트 추출 실패", e);
        }
    }

    /**
     * 수의사 자격증 정보를 파싱합니다.
     */
    public VetLicenseInfo parseVetLicenseInfo(String extractedText) {
        VetLicenseInfo info = new VetLicenseInfo();
        info.setRawText(extractedText); // 원본 텍스트 저장
        
        log.info("=== 자격증 텍스트 파싱 시작 ===");
        log.info("추출된 원본 텍스트: {}", extractedText);
        
        // 텍스트 정규화 (줄바꿈을 공백으로 변환)
        String normalizedText = extractedText.replaceAll("\\s+", " ").trim();
        log.info("정규화된 텍스트: {}", normalizedText);
        
        try {
            // 이름 추출 (한글 이름 패턴) - 더 다양한 패턴 시도
            Pattern[] namePatterns = {
                Pattern.compile("([가-힣]{2,4})\\s*(?:수의사|의사)"),
                Pattern.compile("성명\\s*[:\\s]*([가-힣]{2,4})"),
                Pattern.compile("이름\\s*[:\\s]*([가-힣]{2,4})"),
                Pattern.compile("([가-힣]{2,4})\\s*수의사"),
                Pattern.compile("성\\s*명\\s*([가-힣]{2,4})"),
                Pattern.compile("1\\.\\s*성\\s*명\\s*([가-힣]{2,4})")
            };
            
            for (Pattern pattern : namePatterns) {
                Matcher matcher = pattern.matcher(normalizedText);
                if (matcher.find()) {
                    info.setName(matcher.group(1));
                    log.info("이름 추출 성공: {}", info.getName());
                    break;
                }
            }
            
            // 생년월일 추출 (더 간단한 패턴)
            Pattern[] birthPatterns = {
                Pattern.compile("생년월일\\s*((19|20)\\d{2})년\\s*((0?[1-9]|1[0-2]))월\\s*((0?[1-9]|[12]\\d|3[01]))일"),
                Pattern.compile("2\\.\\s*생년월일\\s*((19|20)\\d{2})년\\s*((0?[1-9]|1[0-2]))월\\s*((0?[1-9]|[12]\\d|3[01]))일")
            };
            
            for (Pattern pattern : birthPatterns) {
                Matcher matcher = pattern.matcher(normalizedText);
                boolean found = matcher.find();
                log.info("생년월일 패턴 테스트: {} -> 매칭: {}", pattern.pattern(), found);
                if (found) {
                    String year = matcher.group(1);
                    String month = matcher.group(3);
                    String day = matcher.group(4);
                    
                    // yyyy-mm-dd 형식으로 변환
                    String formattedDate = String.format("%s-%02d-%02d", 
                        year, Integer.parseInt(month), Integer.parseInt(day));
                    info.setBirthDate(formattedDate);
                    log.info("생년월일 추출 성공: {} -> {}", matcher.group(0), formattedDate);
                    break;
                }
            }
            
            // 최초발급일 추출 (더 간단한 패턴)
            Pattern[] issuePatterns = {
                Pattern.compile("최초발급일\\s*((19|20)\\d{2})년\\s*((0?[1-9]|1[0-2]))월\\s*((0?[1-9]|[12]\\d|3[01]))일")
            };
            
            for (Pattern pattern : issuePatterns) {
                Matcher matcher = pattern.matcher(normalizedText);
                boolean found = matcher.find();
                log.info("최초발급일 패턴 테스트: {} -> 매칭: {}", pattern.pattern(), found);
                if (found) {
                    String year = matcher.group(1);
                    String month = matcher.group(3);
                    String day = matcher.group(4);
                    
                    // yyyy-mm-dd 형식으로 변환
                    String formattedDate = String.format("%s-%02d-%02d", 
                        year, Integer.parseInt(month), Integer.parseInt(day));
                    info.setIssueDate(formattedDate);
                    log.info("최초발급일 추출 성공: {} -> {}", matcher.group(0), formattedDate);
                    break;
                }
            }
            
            log.info("=== 파싱 결과 ===");
            log.info("이름: {}", info.getName());
            log.info("생년월일: {}", info.getBirthDate());
            log.info("최초발급일: {}", info.getIssueDate());
            
        } catch (Exception e) {
            log.error("자격증 정보 파싱 중 오류 발생", e);
        }
        
        return info;
    }

    /**
     * 수의사 자격증 이미지를 분석합니다.
     */
    public VetLicenseInfo analyzeVetLicense(MultipartFile file) throws IOException {
        String extractedText = extractTextFromImage(file);
        return parseVetLicenseInfo(extractedText);
    }

    /**
     * 수의사 자격증 정보 DTO
     */
    public static class VetLicenseInfo {
        private String name;
        private String birthDate;
        private String issueDate;
        private String rawText;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getBirthDate() { return birthDate; }
        public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
        
        public String getIssueDate() { return issueDate; }
        public void setIssueDate(String issueDate) { this.issueDate = issueDate; }
        
        public String getRawText() { return rawText; }
        public void setRawText(String rawText) { this.rawText = rawText; }

        @Override
        public String toString() {
            return "VetLicenseInfo{" +
                    "name='" + name + '\'' +
                    ", birthDate='" + birthDate + '\'' +
                    ", issueDate='" + issueDate + '\'' +
                    '}';
        }
    }
} 