package com.petory.controller.shop;

import com.petory.dto.shop.AuctionBidDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionBid;
import com.petory.entity.shop.AuctionItem;
import com.petory.service.shop.AuctionBidService;
import com.petory.repository.shop.AuctionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auction/bids")
@RequiredArgsConstructor
public class AuctionBidController { //입찰 처리

    private final AuctionBidService auctionBidService;
    private final AuctionItemRepository auctionItemRepository;


    /* 입찰 처리*/
    @PostMapping("/{auctionItemId}")
    public ResponseEntity<AuctionBidDto> placeBid(
            @PathVariable Long auctionItemId,
            @RequestParam Integer bidAmount,
            @AuthenticationPrincipal Member member) {

        log.info("입찰 요청: auctionItemId={}, memberId={}, bidAmount={}",
                auctionItemId, member.getMemberId(), bidAmount);

        try {
            // 경매 상품 조회
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AuctionItem auctionItem = auctionItemOpt.get();

            // 입찰 처리
            AuctionBid bid = auctionBidService.placeBid(auctionItemId, member, bidAmount);
            AuctionBidDto bidDto = convertToDto(bid);

            log.info("입찰 완료: bidId={}, bidAmount={}", bid.getId(), bidAmount);
            return ResponseEntity.ok(bidDto);

        } catch (IllegalArgumentException e) {
            log.warn("입찰 실패 (유효성 검사): auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.warn("입찰 실패 (상태 오류): auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.status(409).build(); // Conflict
        } catch (Exception e) {
            log.error("입찰 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


    /* 현재 최고 입찰가 조회*/
    @GetMapping("/{auctionItemId}/highest")
    public ResponseEntity<Integer> getCurrentHighestBid(@PathVariable Long auctionItemId) {
        log.info("현재 최고 입찰가 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Optional<Integer> highestBidOpt = auctionBidService.getCurrentHighestBid(auctionItemOpt.get());
            return highestBidOpt.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.ok(0)); // 입찰이 없으면 0

        } catch (Exception e) {
            log.error("최고 입찰가 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 현재 최고 입찰자 조회*/
    @GetMapping("/{auctionItemId}/winner")
    public ResponseEntity<String> getCurrentHighestBidder(@PathVariable Long auctionItemId) {
        log.info("현재 최고 입찰자 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Optional<Member> winnerOpt = auctionBidService.getCurrentHighestBidder(auctionItemOpt.get());
            return winnerOpt.map(winner -> ResponseEntity.ok(winner.getMember_NickName()))
                    .orElse(ResponseEntity.ok("")); // 입찰자가 없으면 빈 문자열

        } catch (Exception e) {
            log.error("최고 입찰자 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 입찰 내역 조회 (프론트엔드용) */
    @GetMapping("/{auctionItemId}")
    public ResponseEntity<List<AuctionBidDto>> getBidHistoryForAuction(@PathVariable Long auctionItemId) {
        log.info("입찰 내역 조회 요청 (프론트엔드): auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            List<AuctionBid> bids = auctionBidService.getBidHistory(auctionItemOpt.get());
            List<AuctionBidDto> bidDtos = bids.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(bidDtos);

        } catch (Exception e) {
            log.error("입찰 내역 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 사용자 입찰 내역 조회*/
    @GetMapping("/{auctionItemId}/my-bids")
    public ResponseEntity<List<AuctionBidDto>> getMyBidHistory(
            @PathVariable Long auctionItemId,
            @AuthenticationPrincipal Member member) {

        log.info("사용자 입찰 내역 조회 요청: auctionItemId={}, memberId={}",
                auctionItemId, member.getMemberId());

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            List<AuctionBid> bids = auctionBidService.getUserBidHistory(auctionItemOpt.get(), member);
            List<AuctionBidDto> bidDtos = bids.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(bidDtos);

        } catch (Exception e) {
            log.error("사용자 입찰 내역 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 입찰 횟수 조회*/
    @GetMapping("/{auctionItemId}/count")
    public ResponseEntity<Long> getBidCount(@PathVariable Long auctionItemId) {
        log.info("입찰 횟수 조회 요청: auctionItemId={}", auctionItemId);

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            long bidCount = auctionBidService.getBidCount(auctionItemOpt.get());
            return ResponseEntity.ok(bidCount);

        } catch (Exception e) {
            log.error("입찰 횟수 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 사용자 입찰 횟수 조회*/
    @GetMapping("/{auctionItemId}/my-count")
    public ResponseEntity<Long> getMyBidCount(
            @PathVariable Long auctionItemId,
            @AuthenticationPrincipal Member member) {

        log.info("사용자 입찰 횟수 조회 요청: auctionItemId={}, memberId={}",
                auctionItemId, member.getMemberId());

        try {
            Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
            if (auctionItemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            long bidCount = auctionBidService.getUserBidCount(auctionItemOpt.get(), member);
            return ResponseEntity.ok(bidCount);

        } catch (Exception e) {
            log.error("사용자 입찰 횟수 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 입찰 취소 (테스트용)*/
    @DeleteMapping("/{bidId}")
    public ResponseEntity<Void> cancelBid(@PathVariable Long bidId) {
        log.info("입찰 취소 요청: bidId={}", bidId);

        try {
            auctionBidService.cancelBid(bidId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("입찰 취소 실패: bidId={}, error={}", bidId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


     /* AuctionBid를 DTO로 변환 (Service 메서드 사용)*/
    private AuctionBidDto convertToDto(AuctionBid bid) {
        return auctionBidService.convertToDto(bid);
    }
}
