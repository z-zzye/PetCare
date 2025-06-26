package com.petory.controller;

import com.petory.service.CleanBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CleanBotTestController {
    private final CleanBotService cleanBotService;

    /**
     * 텍스트를 필터링하고 결과를 JSON으로 반환하는 API 엔드포인트
     * @param payload "text" 키를 가진 JSON 객체
     * @return 필터링된 텍스트를 담은 JSON 객체
     */
    @PostMapping("/api/test/cleanbot")
    public ResponseEntity<Map<String, String>> filterText(@RequestBody Map<String, String> payload) {
        String originalText = payload.get("text");
        String filteredText = cleanBotService.filter(originalText);
        Map<String, String> response = Map.of("filteredText", filteredText);
        return ResponseEntity.ok(response);
    }
}