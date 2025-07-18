package com.petory.controller;

import com.petory.dto.CreatorApplyDto;
import com.petory.entity.CreatorApply;
import com.petory.service.CreatorApplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/creator-apply")
public class CreatorApplyController {
    
    private final CreatorApplyService creatorApplyService;
    
    /**
     * 크리에이터 신청
     */
    @PostMapping("/apply")
    public ResponseEntity<?> applyForCreator(@RequestBody CreatorApplyDto creatorApplyDto) {
        try {
            // 현재 로그인한 사용자의 이메일 가져오기
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            CreatorApply creatorApply = creatorApplyService.applyForCreator(creatorApplyDto, memberEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "크리에이터 신청이 완료되었습니다.");
            response.put("applyId", creatorApply.getApplyId());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "크리에이터 신청 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 내 크리에이터 신청 내역 조회
     */
    @GetMapping("/my-applies")
    public ResponseEntity<?> getMyCreatorApplies() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            List<CreatorApply> applies = creatorApplyService.getCreatorAppliesByMember(memberEmail);
            
            return ResponseEntity.ok(applies);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "신청 내역 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 내 최신 크리에이터 신청 조회
     */
    @GetMapping("/my-latest-apply")
    public ResponseEntity<?> getMyLatestCreatorApply() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            var latestApply = creatorApplyService.getLatestCreatorApplyByMember(memberEmail);
            
            if (latestApply.isPresent()) {
                return ResponseEntity.ok(latestApply.get());
            } else {
                return ResponseEntity.ok(Map.of("message", "신청 내역이 없습니다."));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "신청 내역 조회 중 오류가 발생했습니다."));
        }
    }
} 