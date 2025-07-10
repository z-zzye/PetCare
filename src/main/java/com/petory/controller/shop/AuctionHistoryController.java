package com.petory.controller.shop;

import com.petory.dto.shop.AuctionHistoryDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionHistory;
import com.petory.entity.shop.AuctionItem;
import com.petory.service.shop.AuctionHistoryService;
import com.petory.repository.shop.AuctionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

    /**
     * 사용자의 경매 히스토리 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<AuctionHistoryDto>> getMyHistory(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<List<AuctionHistoryDto>> getMyWinHistory(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<List<AuctionHistoryDto>> getMyLoseHistory(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<Long> getMyParticipantCount(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<Long> getMyWinCount(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<Double> getMyWinRate(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<Integer> getMyMaxBid(@AuthenticationPrincipal Member member) {
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
    public ResponseEntity<Double> getMyAverageBid(@AuthenticationPrincipal Member member) {
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
            @AuthenticationPrincipal Member member) {

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
}
