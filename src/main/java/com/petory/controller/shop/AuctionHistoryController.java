package com.petory.controller.shop;

import com.petory.config.CustomUserDetails;
import com.petory.dto.shop.AuctionHistoryDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionHistory;
import com.petory.entity.shop.AuctionItem;
import com.petory.service.shop.AuctionHistoryService;
import com.petory.service.shop.AuctionDeliveryService;
import com.petory.repository.shop.AuctionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auction/history")
@RequiredArgsConstructor
public class AuctionHistoryController { //경매 결과 조회

    private final AuctionHistoryService auctionHistoryService;
    private final AuctionItemRepository auctionItemRepository;
    private final AuctionDeliveryService auctionDeliveryService;

    /* 사용자의 경매 히스토리 조회*/
    @GetMapping("/my")
    public ResponseEntity<List<AuctionHistoryDto>> getMyHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 경매 히스토리 조회 요청: memberId={}", member.getMemberId());

        try {
            List<AuctionHistory> histories = auctionHistoryService.getUserHistory(member);
            List<AuctionHistoryDto> historyDtos = histories.stream()
                    .map(auctionHistoryService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyDtos);

        } catch (Exception e) {
            log.error("사용자 경매 히스토리 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }



    @GetMapping("/auction/{auctionItemId}/my")
    public ResponseEntity<AuctionHistoryDto> getMyAuctionHistory(@PathVariable Long auctionItemId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        Optional<AuctionHistory> myHistoryOpt = auctionHistoryService.getAuctionHistoryForMember(auctionItemId, member.getMemberId());
        if (myHistoryOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AuctionHistoryDto dto = auctionHistoryService.convertToDto(myHistoryOpt.get());
        return ResponseEntity.ok(dto);
    }

    /* 경매 낙찰 배송지 입력/요청*/
    @PostMapping("/{historyId}/delivery")
    public ResponseEntity<?> inputDeliveryAddress(
            @PathVariable Long historyId,
            @RequestBody String deliveryAddress, // JSON 문자열로 받음(실제 운영시 DTO 권장)
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        try {
            // AuctionHistoryService.inputDelivery() 대신 AuctionDeliveryService 사용
            // TODO: 실제로는 AuctionDeliveryRequestDto를 받아서 처리해야 함
            // auctionDeliveryService.inputDeliveryAddress(historyId, requestDto, member);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("경매 배송지 입력 실패: historyId={}, memberId={}, error={}", historyId, member.getMemberId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("배송지 입력 실패");
        }
    }
}
