package com.petory.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import com.petory.dto.board.CrawlingRequestDto;
import com.petory.dto.board.BoardCreateDto;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CrawlingService {
    
    private static final String CRAWLING_IMAGE_DIR = "C:/petory/crawling/";
    
    /**
     * 웹 페이지를 크롤링하여 게시글 데이터를 추출합니다.
     */
    public BoardCreateDto crawlWebPage(CrawlingRequestDto requestDto) {
        try {
            // 크롤링 이미지 디렉토리 생성
            createCrawlingImageDirectory();
            
            // 웹 페이지 크롤링
            Document doc = Jsoup.connect(requestDto.getUrl())
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .timeout(10000)
                    .get();
            
            // 제목 추출
            String title = extractTitle(doc, requestDto);
            
            // 내용 추출
            String content = extractContent(doc, requestDto);
            
            // 이미지 추출 및 다운로드
            List<String> images = extractAndDownloadImages(doc, requestDto, requestDto.getUrl());
            
            // 내용에서 이미지 URL 추출 (추가)
            List<String> contentImages = extractImagesFromContent(content);
            images.addAll(contentImages);
            
            // 중복 제거
            images = images.stream().distinct().collect(java.util.stream.Collectors.toList());
            
            // 이미지를 내용에 추가 (HTML 태그로 표시)
            if (!images.isEmpty()) {
                content += "\n\n[원본 이미지들]\n";
                for (String imageUrl : images) {
                    // 이미지 URL을 HTML img 태그로 변환
                    content += "<img src=\"" + imageUrl + "\" alt=\"크롤링된 이미지\" style=\"max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);\" />\n";
                }
            }
            
            // BoardCreateDto 생성
            BoardCreateDto boardCreateDto = new BoardCreateDto();
            boardCreateDto.setTitle(title);
            boardCreateDto.setContent(content);
            boardCreateDto.setBoardKind(requestDto.getBoardKind());
            boardCreateDto.setHashtags(requestDto.getHashtags());
            
            return boardCreateDto;
            
        } catch (IOException e) {
            log.error("크롤링 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("웹 페이지 크롤링에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 크롤링 이미지 디렉토리를 생성합니다.
     */
    private void createCrawlingImageDirectory() {
        try {
            Path directory = Paths.get(CRAWLING_IMAGE_DIR);
            if (!Files.exists(directory)) {
                Files.createDirectories(directory);
                log.info("크롤링 이미지 디렉토리 생성: {}", CRAWLING_IMAGE_DIR);
            }
        } catch (IOException e) {
            log.error("크롤링 이미지 디렉토리 생성 실패: {}", e.getMessage());
        }
    }
    
    /**
     * 제목을 추출합니다.
     */
    private String extractTitle(Document doc, CrawlingRequestDto requestDto) {
        String title = requestDto.getTitle(); // 기본값으로 요청에서 받은 제목 사용
        
        // 커스텀 선택자가 있는 경우 해당 선택자로 추출
        if (requestDto.getTitleSelector() != null && !requestDto.getTitleSelector().isEmpty()) {
            Element titleElement = doc.selectFirst(requestDto.getTitleSelector());
            if (titleElement != null) {
                title = titleElement.text().trim();
            }
        } else {
            // 기본 선택자들로 시도
            String[] defaultTitleSelectors = {
                "h1", "h2", ".title", ".post-title", ".article-title", 
                "meta[property=og:title]", "title"
            };
            
            for (String selector : defaultTitleSelectors) {
                Element element = doc.selectFirst(selector);
                if (element != null) {
                    String extractedTitle = element.text().trim();
                    if (!extractedTitle.isEmpty()) {
                        title = extractedTitle;
                        break;
                    }
                }
            }
        }
        
        return title;
    }
    
    /**
     * 내용을 추출합니다.
     */
    private String extractContent(Document doc, CrawlingRequestDto requestDto) {
        StringBuilder content = new StringBuilder();
        
        // 커스텀 선택자가 있는 경우
        if (requestDto.getContentSelector() != null && !requestDto.getContentSelector().isEmpty()) {
            Elements contentElements = doc.select(requestDto.getContentSelector());
            for (Element element : contentElements) {
                content.append(element.text().trim()).append("\n\n");
            }
        } else {
            // 기본 선택자들로 시도
            String[] defaultContentSelectors = {
                ".content", ".post-content", ".article-content", ".entry-content",
                ".post-body", ".article-body", "main", ".main-content"
            };
            
            for (String selector : defaultContentSelectors) {
                Elements elements = doc.select(selector);
                if (!elements.isEmpty()) {
                    for (Element element : elements) {
                        content.append(element.text().trim()).append("\n\n");
                    }
                    break;
                }
            }
            
            // 기본 선택자로도 찾지 못한 경우 body 전체에서 텍스트 추출
            if (content.length() == 0) {
                content.append(doc.body().text().trim());
            }
        }
        
        return content.toString().trim();
    }
    
    /**
     * 이미지를 추출하고 다운로드합니다.
     */
    private List<String> extractAndDownloadImages(Document doc, CrawlingRequestDto requestDto, String baseUrl) {
        List<String> images = new ArrayList<>();
        
        // 이미지 가져오기를 하지 않는 경우
        if ("none".equals(requestDto.getImageSelector())) {
            return images;
        }
        
        log.info("이미지 추출 및 다운로드 시작 - URL: {}", baseUrl);
        
        // 커스텀 이미지 선택자가 있는 경우
        if (requestDto.getImageSelector() != null && !requestDto.getImageSelector().isEmpty() && !"none".equals(requestDto.getImageSelector())) {
            Elements imageElements = doc.select(requestDto.getImageSelector());
            log.info("커스텀 선택자로 찾은 이미지 개수: {}", imageElements.size());
            for (Element element : imageElements) {
                String src = element.attr("src");
                String dataSrc = element.attr("data-src"); // lazy loading
                String dataOriginal = element.attr("data-original"); // lazy loading
                
                String imageUrl = src.isEmpty() ? (dataSrc.isEmpty() ? dataOriginal : dataSrc) : src;
                
                if (!imageUrl.isEmpty()) {
                    log.info("발견된 이미지 URL: {}", imageUrl);
                    String absoluteUrl = convertToAbsoluteUrl(imageUrl, baseUrl);
                    if (absoluteUrl != null && isValidImageUrl(absoluteUrl)) {
                        String downloadedUrl = downloadImage(absoluteUrl);
                        if (downloadedUrl != null) {
                            images.add(downloadedUrl);
                            log.info("✅ 다운로드된 이미지: {}", downloadedUrl);
                        }
                    }
                }
            }
        } else {
            // 기본적으로 모든 이미지 추출
            Elements imageElements = doc.select("img");
            log.info("전체 이미지 개수: {}", imageElements.size());
            
            for (int i = 0; i < imageElements.size(); i++) {
                Element element = imageElements.get(i);
                String src = element.attr("src");
                String dataSrc = element.attr("data-src");
                String dataOriginal = element.attr("data-original");
                String alt = element.attr("alt");
                String className = element.attr("class");
                String id = element.attr("id");
                
                log.info("이미지 {}: src='{}', data-src='{}', data-original='{}', alt='{}', class='{}', id='{}'", 
                        i + 1, src, dataSrc, dataOriginal, alt, className, id);
                
                String imageUrl = src.isEmpty() ? (dataSrc.isEmpty() ? dataOriginal : dataSrc) : src;
                
                if (!imageUrl.isEmpty()) {
                    String absoluteUrl = convertToAbsoluteUrl(imageUrl, baseUrl);
                    log.info("절대 URL 변환: {} -> {}", imageUrl, absoluteUrl);
                    
                    if (absoluteUrl != null) {
                        boolean isValid = isValidImageUrl(absoluteUrl);
                        boolean isAd = isAdvertisementImage(absoluteUrl, alt);
                        log.info("이미지 검증: isValid={}, isAd={}", isValid, isAd);
                        
                        if (isValid && !isAd) {
                            String downloadedUrl = downloadImage(absoluteUrl);
                            if (downloadedUrl != null) {
                                images.add(downloadedUrl);
                                log.info("✅ 다운로드된 이미지: {}", downloadedUrl);
                            }
                        } else {
                            log.info("❌ 필터링된 이미지: {} (isValid={}, isAd={})", absoluteUrl, isValid, isAd);
                        }
                    } else {
                        log.info("❌ URL 변환 실패: {}", imageUrl);
                    }
                } else {
                    log.info("❌ 빈 이미지 URL");
                }
            }
        }
        
        log.info("최종 다운로드된 이미지 개수: {}", images.size());
        return images;
    }
    
    /**
     * 유효한 이미지 URL인지 확인합니다.
     */
    private boolean isValidImageUrl(String src) {
        // base64 이미지 제외
        if (src.startsWith("data:")) {
            log.info("❌ base64 이미지 제외: {}", src);
            return false;
        }
        
        // 빈 URL 제외
        if (src.isEmpty()) {
            log.info("❌ 빈 URL 제외");
            return false;
        }
        
        // 너무 작은 이미지나 아이콘 제외 (더 관대하게)
        String lowerSrc = src.toLowerCase();
        if (lowerSrc.contains("icon") || lowerSrc.contains("logo") || 
            lowerSrc.contains("avatar") || lowerSrc.contains("emoji")) {
            log.info("❌ 아이콘/로고 제외: {}", src);
            return false;
        }
        
        // 이미지 확장자 확인 (더 관대하게)
        boolean isValid = lowerSrc.endsWith(".jpg") || lowerSrc.endsWith(".jpeg") || 
               lowerSrc.endsWith(".png") || lowerSrc.endsWith(".gif") || 
               lowerSrc.endsWith(".webp") || lowerSrc.endsWith(".svg") ||
               lowerSrc.contains("image") || lowerSrc.contains("photo") ||
               lowerSrc.contains("img") || lowerSrc.contains("upload") ||
               lowerSrc.contains("cdn") || lowerSrc.contains("static") ||
               lowerSrc.contains("pstatic.net") || lowerSrc.contains("postfiles");
        
        if (!isValid) {
            log.info("❌ 이미지 확장자/키워드 불일치: {}", src);
        }
        
        return isValid;
    }
    
    /**
     * 광고 이미지인지 확인합니다.
     */
    private boolean isAdvertisementImage(String src, String alt) {
        String lowerSrc = src.toLowerCase();
        String lowerAlt = alt.toLowerCase();
        
        // 명확한 광고 관련 키워드만 필터링
        return (lowerSrc.contains("ad") && lowerSrc.contains("banner")) || 
               lowerAlt.contains("광고") || lowerAlt.contains("배너") ||
               lowerSrc.contains("sponsor") || lowerAlt.contains("스폰서") ||
               lowerSrc.contains("googlead") || lowerSrc.contains("doubleclick");
    }
    
    /**
     * 상대 경로를 절대 경로로 변환합니다.
     */
    private String convertToAbsoluteUrl(String src, String baseUrl) {
        try {
            // 이미 절대 URL인 경우
            if (src.startsWith("http://") || src.startsWith("https://")) {
                return src;
            }
            
            // 상대 경로인 경우 절대 경로로 변환
            if (src.startsWith("/")) {
                // 도메인만 추출
                java.net.URL url = new java.net.URL(baseUrl);
                String domain = url.getProtocol() + "://" + url.getHost();
                if (url.getPort() != -1) {
                    domain += ":" + url.getPort();
                }
                return domain + src;
            }
            
            // 상대 경로인 경우
            if (!src.startsWith("http")) {
                java.net.URL base = new java.net.URL(baseUrl);
                java.net.URL absolute = new java.net.URL(base, src);
                return absolute.toString();
            }
            
            return src;
        } catch (Exception e) {
            log.warn("URL 변환 실패: {} -> {}", src, e.getMessage());
            return null;
        }
    }
    
    /**
     * 이미지를 다운로드하고 로컬 URL을 반환합니다.
     */
    private String downloadImage(String imageUrl) {
        try {
            // 파일 확장자 추출
            String extension = getImageExtension(imageUrl);
            if (extension == null) {
                log.warn("이미지 확장자를 추출할 수 없습니다: {}", imageUrl);
                return null;
            }
            
            // 고유한 파일명 생성
            String fileName = UUID.randomUUID().toString() + extension;
            Path filePath = Paths.get(CRAWLING_IMAGE_DIR, fileName);
            
            // 이미지 다운로드
            URL url = new URL(imageUrl);
            try (InputStream in = url.openStream()) {
                Files.copy(in, filePath, StandardCopyOption.REPLACE_EXISTING);
                log.info("이미지 다운로드 완료: {} -> {}", imageUrl, filePath);
                
                // 웹에서 접근 가능한 URL 반환
                return "/images/crawling/" + fileName;
            }
        } catch (Exception e) {
            log.error("이미지 다운로드 실패: {} - {}", imageUrl, e.getMessage());
            return null;
        }
    }
    
    /**
     * 이미지 URL에서 확장자를 추출합니다.
     */
    private String getImageExtension(String imageUrl) {
        String lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.contains(".jpg") || lowerUrl.contains(".jpeg")) {
            return ".jpg";
        } else if (lowerUrl.contains(".png")) {
            return ".png";
        } else if (lowerUrl.contains(".gif")) {
            return ".gif";
        } else if (lowerUrl.contains(".webp")) {
            return ".webp";
        } else if (lowerUrl.contains(".svg")) {
            return ".svg";
        }
        return ".jpg"; // 기본값
    }
    
    /**
     * 텍스트 내용에서 이미지 URL을 추출합니다.
     */
    private List<String> extractImagesFromContent(String content) {
        List<String> images = new ArrayList<>();
        
        log.info("내용에서 이미지 추출 시작. 내용 길이: {}", content.length());
        
        // 간단한 방법으로 이미지 URL 찾기
        String[] lines = content.split("\n");
        for (String line : lines) {
            line = line.trim();
            
            // pstatic.net 이미지
            if (line.contains("postfiles.pstatic.net")) {
                int start = line.indexOf("https://postfiles.pstatic.net");
                if (start >= 0) {
                    String imageUrl = line.substring(start);
                    // 공백이나 특수문자로 끝나는 경우 잘라내기
                    int end = imageUrl.indexOf(" ");
                    if (end > 0) imageUrl = imageUrl.substring(0, end);
                    end = imageUrl.indexOf("\n");
                    if (end > 0) imageUrl = imageUrl.substring(0, end);
                    
                    log.info("pstatic.net에서 발견된 이미지: {}", imageUrl);
                    images.add(imageUrl);
                }
            }
            
            // 일반적인 이미지 파일 확장자
            if (line.contains(".jpg") || line.contains(".jpeg") || line.contains(".png") || 
                line.contains(".gif") || line.contains(".webp") || line.contains(".svg")) {
                
                // https로 시작하는 URL 찾기
                if (line.contains("https://")) {
                    int start = line.indexOf("https://");
                    String imageUrl = line.substring(start);
                    int end = imageUrl.indexOf(" ");
                    if (end > 0) imageUrl = imageUrl.substring(0, end);
                    end = imageUrl.indexOf("\n");
                    if (end > 0) imageUrl = imageUrl.substring(0, end);
                    
                    log.info("https 이미지에서 발견된 이미지: {}", imageUrl);
                    images.add(imageUrl);
                }
                // 상대 경로 이미지
                else if (line.contains("/") && (line.contains(".png") || line.contains(".jpg") || line.contains(".gif"))) {
                    String imageUrl = line;
                    if (!imageUrl.startsWith("http")) {
                        if (imageUrl.startsWith("/")) {
                            imageUrl = "https://www.mongseng.io" + imageUrl;
                        } else {
                            imageUrl = "https://www.mongseng.io/" + imageUrl;
                        }
                    }
                    
                    log.info("상대 경로에서 발견된 이미지: {}", imageUrl);
                    images.add(imageUrl);
                }
            }
        }
        
        log.info("내용에서 추출된 이미지 개수: {}", images.size());
        return images;
    }
    
    /**
     * 특정 사이트에 대한 크롤링 설정을 제공합니다.
     */
    public CrawlingRequestDto getCrawlingConfigForSite(String url) {
        CrawlingRequestDto config = new CrawlingRequestDto();
        config.setUrl(url);
        
        // 사이트별 기본 설정
        if (url.contains("blog.naver.com")) {
            config.setTitleSelector(".se-title-text");
            config.setContentSelector(".se-main-container");
        } else if (url.contains("blog.daum.net")) {
            config.setTitleSelector(".tit_post");
            config.setContentSelector(".post_content");
        } else if (url.contains("tistory.com")) {
            config.setTitleSelector(".titleWrap h2");
            config.setContentSelector(".entry-content");
        }
        
        return config;
    }
} 