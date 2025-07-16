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

    /**
     * 사용자의 경매 히스토리 조회
     */
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

    /**
     * 사용자의 낙찰 성공 히스토리 조회
     */
    @GetMapping("/my/wins")
    public ResponseEntity<List<AuctionHistoryDto>> getMyWinHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 낙찰 성공 히스토리 조회 요청: memberId={}", member.getMemberId());

        try {
            List<AuctionHistory> winHistories = auctionHistoryService.getUserWinHistory(member);
            List<AuctionHistoryDto> historyDtos = winHistories.stream()
                    .map(auctionHistoryService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyDtos);

        } catch (Exception e) {
            log.error("사용자 낙찰 성공 히스토리 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 낙찰 실패 히스토리 조회
     */
    @GetMapping("/my/losses")
    public ResponseEntity<List<AuctionHistoryDto>> getMyLoseHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 낙찰 실패 히스토리 조회 요청: memberId={}", member.getMemberId());

        try {
            List<AuctionHistory> loseHistories = auctionHistoryService.getUserLoseHistory(member);
            List<AuctionHistoryDto> historyDtos = loseHistories.stream()
                    .map(auctionHistoryService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyDtos);

        } catch (Exception e) {
            log.error("사용자 낙찰 실패 히스토리 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 경매의 모든 히스토리 조회
     */
    @GetMapping("/auction/{auctionItemId}")
    public ResponseEntity<List<AuctionHistoryDto>> getAuctionHistory(@PathVariable Long auctionItemId) {
        log.info("경매 히스토리 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            List<AuctionHistory> histories = auctionHistoryService.getAuctionHistory(auctionItemOpt.get());
            List<AuctionHistoryDto> historyDtos = histories.stream()
                    .map(auctionHistoryService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyDtos);

        } catch (Exception e) {
            log.error("경매 히스토리 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 경매의 낙찰자 조회
     */
    @GetMapping("/auction/{auctionItemId}/winner")
    public ResponseEntity<AuctionHistoryDto> getAuctionWinner(@PathVariable Long auctionItemId) {
        log.info("경매 낙찰자 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Optional<AuctionHistory> winnerOpt = auctionHistoryService.getAuctionWinner(auctionItemOpt.get());
            if (winnerOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AuctionHistoryDto winnerDto = auctionHistoryService.convertToDto(winnerOpt.get());
            return ResponseEntity.ok(winnerDto);

        } catch (Exception e) {
            log.error("경매 낙찰자 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 경매 참여 횟수 조회
     */
    @GetMapping("/my/participant-count")
    public ResponseEntity<Long> getMyParticipantCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 경매 참여 횟수 조회 요청: memberId={}", member.getMemberId());

        try {
            long count = auctionHistoryService.getUserParticipantCount(member);
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            log.error("사용자 경매 참여 횟수 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 낙찰 성공 횟수 조회
     */
    @GetMapping("/my/win-count")
    public ResponseEntity<Long> getMyWinCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 낙찰 성공 횟수 조회 요청: memberId={}", member.getMemberId());

        try {
            long count = auctionHistoryService.getUserWinCount(member);
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            log.error("사용자 낙찰 성공 횟수 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 낙찰률 조회
     */
    @GetMapping("/my/win-rate")
    public ResponseEntity<Double> getMyWinRate(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 낙찰률 조회 요청: memberId={}", member.getMemberId());

        try {
            double winRate = auctionHistoryService.getUserWinRate(member);
            return ResponseEntity.ok(winRate);

        } catch (Exception e) {
            log.error("사용자 낙찰률 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 최고 입찰가 조회
     */
    @GetMapping("/my/max-bid")
    public ResponseEntity<Integer> getMyMaxBid(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 최고 입찰가 조회 요청: memberId={}", member.getMemberId());

        try {
            Optional<Integer> maxBidOpt = auctionHistoryService.getUserMaxBid(member);
            return maxBidOpt.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.ok(0));

        } catch (Exception e) {
            log.error("사용자 최고 입찰가 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 평균 입찰가 조회
     */
    @GetMapping("/my/average-bid")
    public ResponseEntity<Double> getMyAverageBid(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Member member = userDetails.getMember();
        log.info("사용자 평균 입찰가 조회 요청: memberId={}", member.getMemberId());

        try {
            Optional<Double> avgBidOpt = auctionHistoryService.getUserAverageBid(member);
            return avgBidOpt.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.ok(0.0));

        } catch (Exception e) {
            log.error("사용자 평균 입찰가 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 시간 범위의 히스토리 조회
     */
    @GetMapping("/time-range")
    public ResponseEntity<List<AuctionHistoryDto>> getHistoryByTimeRange(
            @RequestParam String startTime,
            @RequestParam String endTime,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Member member = userDetails.getMember();
        log.info("시간 범위 히스토리 조회 요청: memberId={}, startTime={}, endTime={}",
                member.getMemberId(), startTime, endTime);

        try {
            LocalDateTime start = LocalDateTime.parse(startTime);
            LocalDateTime end = LocalDateTime.parse(endTime);

            List<AuctionHistory> histories = auctionHistoryService.getUserHistoryByTimeRange(member, start, end);
            List<AuctionHistoryDto> historyDtos = histories.stream()
                    .map(auctionHistoryService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyDtos);

        } catch (Exception e) {
            log.error("시간 범위 히스토리 조회 실패: memberId={}, error={}", member.getMemberId(), e.getMessage());
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

    /**
     * 경매 낙찰 배송지 입력/요청
     */
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
