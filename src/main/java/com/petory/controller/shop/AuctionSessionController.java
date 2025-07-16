package com.petory.controller.shop;

import com.petory.dto.shop.AuctionSessionDto;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.shop.AuctionSession;
import com.petory.service.shop.AuctionSessionService;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.constant.AuctionSessionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auction/sessions")
@RequiredArgsConstructor
public class AuctionSessionController { //세션관리

    private final AuctionSessionService auctionSessionService;
    private final AuctionItemRepository auctionItemRepository;


    /* 경매 세션 생성*/
    @PostMapping("/{auctionItemId}")
    public ResponseEntity<AuctionSessionDto> createSession(@PathVariable Long auctionItemId) {
        log.info("경매 세션 생성 요청: auctionItemId={}", auctionItemId);

        try {
            // 경매 상품 조회
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AuctionItem auctionItem = auctionItemOpt.get();

            // 세션 생성
            AuctionSession session = auctionSessionService.createSession(auctionItem);
            AuctionSessionDto sessionDto = auctionSessionService.convertToDto(session);

            log.info("경매 세션 생성 완료: sessionId={}", session.getId());
            return ResponseEntity.ok(sessionDto);

        } catch (Exception e) {
            log.error("경매 세션 생성 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /* 세션 조회 (ID로)*/
    @GetMapping("/{sessionId}")
    public ResponseEntity<AuctionSessionDto> getSession(@PathVariable Long sessionId) {
        log.info("세션 조회 요청: sessionId={}", sessionId);

        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AuctionSessionDto sessionDto = auctionSessionService.convertToDto(sessionOpt.get());
        return ResponseEntity.ok(sessionDto);
    }


    /* 세션 조회 (세션 키로)*/
    @GetMapping("/key/{sessionKey}")
    public ResponseEntity<AuctionSessionDto> getSessionByKey(@PathVariable String sessionKey) {
        log.info("세션 조회 요청: sessionKey={}", sessionKey);

        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionByKey(sessionKey);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AuctionSessionDto sessionDto = auctionSessionService.convertToDto(sessionOpt.get());
        return ResponseEntity.ok(sessionDto);
    }


    /* 경매 상품으로 세션 조회*/
    @GetMapping("/auction/{auctionItemId}")
    public ResponseEntity<AuctionSessionDto> getSessionByAuctionItem(@PathVariable Long auctionItemId) {
        log.info("경매 상품 세션 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionByAuctionItem(auctionItemOpt.get());
            if (sessionOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AuctionSessionDto sessionDto = auctionSessionService.convertToDto(sessionOpt.get());
            return ResponseEntity.ok(sessionDto);

        } catch (Exception e) {
            log.error("경매 상품 세션 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /* 활성 세션 목록 조회*/
    @GetMapping("/active")
    public ResponseEntity<List<AuctionSessionDto>> getActiveSessions() {
        log.info("활성 세션 목록 조회 요청");

        List<AuctionSession> activeSessions = auctionSessionService.getActiveSessions();
        List<AuctionSessionDto> sessionDtos = activeSessions.stream()
                .map(auctionSessionService::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(sessionDtos);
    }


    /* 세션 상태 업데이트*/
    @PutMapping("/{sessionId}/status")
    public ResponseEntity<?> updateSessionStatus(
            @PathVariable Long sessionId,
            @RequestParam String status) {
        log.info("세션 상태 업데이트 요청: sessionId={}, status={}", sessionId, status);

        try {
            // String을 enum으로 변환
            AuctionSessionStatus sessionStatus = AuctionSessionStatus.valueOf(status.toUpperCase());
            auctionSessionService.updateSessionStatus(sessionId, sessionStatus);
            return ResponseEntity.ok().build();

        } catch (IllegalArgumentException e) {
            log.error("잘못된 상태값: sessionId={}, status={}", sessionId, status);
            return ResponseEntity.badRequest().body("잘못된 상태값입니다: " + status);
        } catch (Exception e) {
            log.error("세션 상태 업데이트 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /* 세션 종료*/
    @PostMapping("/{sessionId}/end")
    public ResponseEntity<Void> endSession(@PathVariable Long sessionId) {
        log.info("세션 종료 요청: sessionId={}", sessionId);

        try {
            auctionSessionService.endSession(sessionId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("세션 종료 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /* 세션 활성화 상태 확인*/
    @GetMapping("/{sessionId}/active")
    public ResponseEntity<Boolean> isSessionActive(@PathVariable Long sessionId) {
        log.info("세션 활성화 상태 확인 요청: sessionId={}", sessionId);

        boolean isActive = auctionSessionService.isSessionActive(sessionId);
        return ResponseEntity.ok(isActive);
    }


    /* 세션 참여 가능 여부 확인*/
    @GetMapping("/{sessionId}/can-join")
    public ResponseEntity<Boolean> canJoinSession(@PathVariable Long sessionId) {
        log.info("세션 참여 가능 여부 확인 요청: sessionId={}", sessionId);

        boolean canJoin = auctionSessionService.canJoinSession(sessionId);
        return ResponseEntity.ok(canJoin);
    }


    /* 남은 시간 조회*/
    @GetMapping("/{sessionId}/remaining-time")
    public ResponseEntity<Long> getRemainingTime(@PathVariable Long sessionId) {
        log.info("남은 시간 조회 요청: sessionId={}", sessionId);

        long remainingTime = auctionSessionService.getRemainingTime(sessionId);
        return ResponseEntity.ok(remainingTime);
    }


    /* 세션 삭제 (테스트용)*/
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long sessionId) {
        log.info("세션 삭제 요청: sessionId={}", sessionId);

        try {
            auctionSessionService.deleteSession(sessionId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("세션 삭제 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /* 오래된 세션 정리 (관리자용)*/
    @PostMapping("/cleanup")
    public ResponseEntity<Void> cleanupOldSessions() {
        log.info("오래된 세션 정리 요청");

        try {
            auctionSessionService.cleanupOldSessions();
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("오래된 세션 정리 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
