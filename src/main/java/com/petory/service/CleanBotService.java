package com.petory.service; // 사용자님의 서비스 패키지 경로

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@Slf4j // 로그 출력을 위한 어노테이션
public class CleanBotService {

    // 욕설 단어를 저장할 Set. 중복을 허용하지 않고 검색 속도가 빠릅니다.
    private final Set<String> badWords = new HashSet<>();

    /**
     * Bean이 생성된 후, 욕설 사전을 로드하기 위해 딱 한 번 실행되는 메서드입니다.
     */
    @PostConstruct
    private void init() {
        try {
            // resources/profanity/bad-words.txt 파일을 읽어옵니다.
            Resource resource = new ClassPathResource("profanity/bad-words.txt");

            // 파일을 한 줄씩 읽어 badWords Set에 추가합니다.
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (StringUtils.hasText(line)) {
                        badWords.add(line.trim());
                    }
                }
            }
            log.info("클린봇 서비스: 욕설 사전 로드 완료 (총 {}개 단어)", badWords.size());
        } catch (IOException e) {
            log.error("클린봇 서비스: 욕설 사전 파일 로드에 실패했습니다.", e);
        }
    }

    /**
     * 입력된 텍스트에 포함된 욕설을 필터링하여 반환합니다.
     * @param text 필터링할 원본 텍스트
     * @return 필터링된 텍스트
     */
    public String filter(String text) {
        // 검열할 글자가 없는 경우(null, "   ") 작업 생략
        if (!StringUtils.hasText(text)) {
            return text;
        }

        String filteredText = text;
        for (String badWord : badWords) {
            // 정규 표현식에서 특수 문자로 취급될 수 있는 문자를 이스케이프 처리합니다.
            String pattern = Pattern.quote(badWord);

            // 단어의 길이만큼 '*'로 치환합니다.
            String replacement = "*".repeat(badWord.length());

            // 대소문자를 구분하지 않고 모든 욕설을 찾아 치환합니다.
            filteredText = filteredText.replaceAll("(?i)" + pattern, replacement);
        }

        return filteredText;
    }

    /**
     * 입력된 텍스트에 욕설이 포함되어 있는지 여부만 확인합니다.
     * @param text 검사할 원본 텍스트
     * @return 욕설 포함 시 true, 아니면 false
     */
    public boolean containsProfanity(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        for (String badWord : badWords) {
            if (text.toLowerCase().contains(badWord)) {
                return true;
            }
        }
        return false;
    }
}