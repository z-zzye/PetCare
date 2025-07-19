package com.petory.controller;

import com.petory.dto.VetApplyDto;
import com.petory.entity.VetApply;
import com.petory.service.VetApplyService;
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
@RequestMapping("/api/vet-apply")
public class VetApplyController {
    
    private final VetApplyService vetApplyService;
    
    /**
     * 수의사 신청
     */
    @PostMapping("/apply")
    public ResponseEntity<?> applyForVet(@RequestBody VetApplyDto vetApplyDto) {
        try {
            // 현재 로그인한 사용자의 이메일 가져오기
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            VetApply vetApply = vetApplyService.applyForVet(vetApplyDto, memberEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "수의사 신청이 완료되었습니다.");
            response.put("applyId", vetApply.getApplyId());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "수의사 신청 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 내 수의사 신청 내역 조회
     */
    @GetMapping("/my-applies")
    public ResponseEntity<?> getMyVetApplies() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            List<VetApply> applies = vetApplyService.getVetAppliesByMember(memberEmail);
            
            return ResponseEntity.ok(applies);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "신청 내역 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 내 최신 수의사 신청 조회
     */
    @GetMapping("/my-latest-apply")
    public ResponseEntity<?> getMyLatestVetApply() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();
            
            var latestApply = vetApplyService.getLatestVetApplyByMember(memberEmail);
            
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