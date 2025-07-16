package com.petory.controller.shop;

import com.petory.dto.shop.AuctionDeliveryDto;
import com.petory.dto.shop.AuctionDeliveryRequestDto;
import com.petory.service.shop.AuctionDeliveryService;
import com.petory.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/auction/delivery")
@RequiredArgsConstructor
public class AuctionDeliveryController {

    private final AuctionDeliveryService auctionDeliveryService;

    /* 낙찰 물품 배송지 정보 입력*/
    @PostMapping("/{historyId}")
    public ResponseEntity<?> registerDeliveryAddress(
            @PathVariable Long historyId,
            @RequestBody AuctionDeliveryRequestDto requestDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long memberId = userDetails.getMemberId();
            auctionDeliveryService.inputDeliveryAddress(historyId, requestDto, memberId);
            return ResponseEntity.ok("배송지 정보가 입력되었습니다.");
        } catch (Exception e) {
            log.error("배송지 정보 입력 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body("배송지 정보 입력 실패: " + e.getMessage());
        }
    }

    /* 개별 배송 정보 조회 (마감일 표시용)*/
    @GetMapping("/{historyId}")
    public ResponseEntity<AuctionDeliveryDto> getDeliveryByHistoryId(
            @PathVariable Long historyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long memberId = userDetails.getMemberId();
            return auctionDeliveryService.getDeliveryByHistoryId(historyId, memberId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("배송 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /* 관리자용 - 모든 배송 정보 조회*/
    @GetMapping("/admin/all")
    public ResponseEntity<List<AuctionDeliveryDto>> getAllDeliveries() {
        try {
            List<AuctionDeliveryDto> deliveries = auctionDeliveryService.getAllDeliveries();
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("전체 배송 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /* 관리자용 - 배송 통계 조회*/
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getDeliveryStats() {
        try {
            return ResponseEntity.ok(auctionDeliveryService.getDeliveryStats());
        } catch (Exception e) {
            log.error("배송 통계 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /* 관리자용 - 조건별 배송 정보 조회*/
    @GetMapping("/admin/filter")
    public ResponseEntity<List<AuctionDeliveryDto>> getFilteredDeliveries(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm) {
        try {
            List<AuctionDeliveryDto> deliveries = auctionDeliveryService.getFilteredDeliveries(status, searchTerm);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("조건별 배송 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
