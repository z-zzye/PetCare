package com.petory.controller;

import com.petory.service.CleanBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CleanBotService cleanBotService;

    /**
     * 금지어 관리 페이지를 보여주는 메서드
     */
    @GetMapping("/profanity")
    public String profanityManagementPage(Model model) {
        String currentProfanityList = cleanBotService.getProfanityListAsString();
        model.addAttribute("profanityList", currentProfanityList);
        return "admin/profanity-manage"; // templates/admin/profanity-manage.html
    }

    /**
     * 금지어 목록을 갱신하는 API
     */
    @PostMapping("/profanity/update")
    public ResponseEntity<String> updateProfanityList(@RequestBody Map<String, String> payload) {
      String updatedList = payload.get("list");
      cleanBotService.updateProfanityList(updatedList);
      return ResponseEntity.ok("금지어 목록이 성공적으로 갱신되었습니다.");
    }
}
