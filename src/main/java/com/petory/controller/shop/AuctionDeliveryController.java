package com.petory.controller.shop;

import com.petory.config.CustomUserDetails;
import com.petory.dto.shop.AuctionDeliveryDto;
import com.petory.dto.shop.AuctionDeliveryRequestDto;
import com.petory.service.shop.AuctionDeliveryService;
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

    /* 배송지 정보 입력*/
    @PostMapping("/{historyId}")
    public ResponseEntity<String> inputDeliveryAddress(
            @PathVariable Long historyId,
            @RequestBody AuctionDeliveryRequestDto requestDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long memberId = userDetails.getMemberId();
            auctionDeliveryService.inputDeliveryAddress(historyId, requestDto, memberId);
            return ResponseEntity.ok("배송지 정보가 성공적으로 입력되었습니다.");
        } catch (IllegalArgumentException e) {
            log.error("배송지 입력 실패 - 잘못된 요청: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            log.error("배송지 입력 실패 - 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("배송지 입력 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("배송지 입력 중 오류가 발생했습니다.");
        }
    }

    /**
     * 배송 정보 조회
     */
    @GetMapping("/{historyId}")
    public ResponseEntity<AuctionDeliveryDto> getDeliveryInfo(
            @PathVariable Long historyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long memberId = userDetails.getMemberId();
            return auctionDeliveryService.getDeliveryByHistoryId(historyId, memberId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("배송 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 모든 배송 정보 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<AuctionDeliveryDto>> getMyDeliveries(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long memberId = userDetails.getMemberId();
            List<AuctionDeliveryDto> deliveries = auctionDeliveryService.getDeliveriesByMemberId(memberId);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("사용자 배송 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
