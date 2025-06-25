package com.petory.controller; // 사용자님의 컨트롤러 패키지 경로

import com.petory.service.CleanBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CleanBotTestController {

    private final CleanBotService cleanBotService;

    /**
     * 테스트 페이지를 보여주는 메서드
     * @return 템플릿 파일 경로
     */
    @GetMapping("/test/cleanbot")
    public String cleanBotTestPage() {
        // resources/templates/test/cleanbot-main.html 을 찾아 반환합니다.
        return "test/cleanbot-test";
    }

    /**
     * 텍스트를 필터링하고 결과를 JSON으로 반환하는 API 엔드포인트
     * @param payload "text" 키를 가진 JSON 객체
     * @return 필터링된 텍스트를 담은 JSON 객체
     */
    @PostMapping("/api/test/cleanbot")
    @ResponseBody // HTML 페이지가 아닌, 데이터(JSON)를 반환함을 명시
    public ResponseEntity<Map<String, String>> filterText(@RequestBody Map<String, String> payload) {
        String originalText = payload.get("text");
        String filteredText = cleanBotService.filter(originalText);

        // 필터링된 텍스트만 간단히 반환합니다.
        Map<String, String> response = Map.of("filteredText", filteredText);

        return ResponseEntity.ok(response);
    }
}