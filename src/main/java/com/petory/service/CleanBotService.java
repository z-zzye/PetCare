package com.petory.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CleanBotService {

    private final Set<String> badWords = Collections.synchronizedSet(new HashSet<>());

    // application.properties에서 외부 파일 경로를 주입받습니다.
    @Value("${profanity.list.path}")
    private String profanityFilePath;

    private Path filePath;

    /**
     * 서버 시작 시 파일 경로를 초기화하고, 파일이 없으면 생성합니다.
     */
    @PostConstruct
    private void init() {
        this.filePath = Paths.get(profanityFilePath);
        log.info("금지어 파일 경로: {}", filePath);
        try {
            // 파일이 위치할 디렉토리가 없으면 생성합니다.
            if (!Files.exists(filePath.getParent())) {
                Files.createDirectories(filePath.getParent());
            }
            // 파일 자체가 없으면 빈 파일을 생성합니다.
            if (!Files.exists(filePath)) {
                Files.createFile(filePath);
                log.info("금지어 파일이 존재하지 않아 새로 생성했습니다: {}", filePath);
            }
        } catch (IOException e) {
            log.error("금지어 파일을 초기화하는 중 오류 발생", e);
        }
        // 초기 금지어 목록을 로드합니다.
        loadProfanityList();
    }

    /**
     * 현재 금지어 목록을 파일에서 읽어와 한 줄씩 포함된 문자열로 반환합니다.
     */
    public String getProfanityListAsString() {
        try {
            String result = Files.readString(filePath, java.nio.charset.StandardCharsets.UTF_8);
            log.info("금지어 파일 실제 반환값: {}", result);
            return result;
        } catch (IOException e) {
            log.error("금지어 목록 파일을 읽는 중 오류 발생", e);
            return "오류: 금지어 목록을 불러올 수 없습니다.";
        }
    }

    /**
     * 새로운 금지어 목록으로 파일을 갱신하고, 메모리의 목록도 다시 로드합니다.
     */
    public void updateProfanityList(String fullTextOfProfanityList) {
        try {
            // 새로운 내용으로 파일을 완전히 덮어씁니다.
            Files.writeString(filePath, fullTextOfProfanityList);
            // 파일 내용이 변경되었으므로, 메모리에 로드된 목록을 다시 로드합니다.
            loadProfanityList();
        } catch (IOException e) {
            log.error("금지어 목록 파일을 저장하는 중 오류 발생", e);
            throw new RuntimeException("금지어 목록을 저장하는 데 실패했습니다.", e);
        }
    }

    /**
     * 욕설이 포함되어 있으면 전체를 경고 문구로 치환합니다.
     */
    public String filter(String text) {
        if (containsProfanity(text)) {
            return "클린봇이 부적절한 단어를 감지하였습니다";
        }
        return text;
    }

    /**
     * 텍스트에 욕설이 포함되어 있는지 확인합니다.
     */
    public boolean containsProfanity(String text) {
        if (!StringUtils.hasText(text)) return false;
        String lowerCaseText = text.toLowerCase();
        return badWords.stream().anyMatch(lowerCaseText::contains);
    }

    /**
     * 텍스트에서 감지된 비속어들을 반환합니다.
     */
    public Set<String> getDetectedProfanity(String text) {
        Set<String> detected = new HashSet<>();
        if (!StringUtils.hasText(text)) return detected;
        
        String lowerCaseText = text.toLowerCase();
        for (String badWord : badWords) {
            if (lowerCaseText.contains(badWord)) {
                detected.add(badWord);
            }
        }
        return detected;
    }

    /**
     * 파일에서 금지어 목록을 읽어와 메모리의 Set을 갱신하는 내부 메서드
     */
    private void loadProfanityList() {
        try {
            badWords.clear(); // 기존 목록을 비웁니다.
            try (BufferedReader reader = Files.newBufferedReader(filePath)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (StringUtils.hasText(line)) {
                        badWords.add(line.trim().toLowerCase());
                    }
                }
            }
            log.info("클린봇 서비스: 욕설 사전 갱신 완료 (총 {}개 단어)", badWords.size());
        } catch (IOException e) {
            log.error("클린봇 서비스: 욕설 사전 파일 로드에 실패했습니다.", e);
        }
    }
}