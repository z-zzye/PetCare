package com.petory.service.shop;

import com.petory.dto.shop.AuctionHistoryDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionHistory;
import com.petory.entity.shop.AuctionItem;
import com.petory.repository.shop.AuctionHistoryRepository;
import com.petory.repository.shop.ItemRepository;
import com.petory.constant.AuctionWinStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.petory.repository.shop.AuctionBidRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuctionHistoryService {

    private final AuctionHistoryRepository auctionHistoryRepository;
    private final ItemRepository itemRepository;
    private final AuctionBidRepository auctionBidRepository;

    /* 경매 히스토리 생성 (경매 종료 시)*/
    @Transactional
    public AuctionHistory createHistory(AuctionItem auctionItem, Member member, Integer finalPrice, boolean isWinner, AuctionWinStatus auctionWinStatus) {
        log.info("경매 히스토리 생성: auctionItemId={}, memberId={}, finalPrice={}, isWinner={}",
                auctionItem.getId(), member.getMemberId(), finalPrice, isWinner);

        // 이미 히스토리가 있는지 확인
        Optional<AuctionHistory> existingHistory = auctionHistoryRepository.findByAuctionItemIdAndMemberId(auctionItem.getId(), member.getMemberId());
        if (existingHistory.isPresent()) {
            log.warn("이미 존재하는 히스토리: historyId={}", existingHistory.get().getId());
            return existingHistory.get();
        }

        // 내 최고 입찰가 조회
        Integer myHighestBid = auctionBidRepository.findMaxBidAmountByAuctionItemAndMember(auctionItem, member).orElse(0);

        // 히스토리 생성
        long totalBids = auctionBidRepository.countByAuctionItemAndMember(auctionItem, member);
        AuctionHistory history = AuctionHistory.builder()
                .auctionItem(auctionItem)
                .member(member)
                .myHighestBid(myHighestBid)
                .isWinner(isWinner)
                .totalBids((int) totalBids)
                .finalPrice(finalPrice)
                .auctionWinStatus(auctionWinStatus)
                .build();

        AuctionHistory savedHistory = auctionHistoryRepository.save(history);
        log.info("경매 히스토리 생성 완료: historyId={}, myHighestBid={}, finalPrice={}",
                savedHistory.getId(), myHighestBid, finalPrice);

        return savedHistory;
    }

    /* 사용자의 경매 히스토리 조회*/
    public List<AuctionHistory> getUserHistory(Member member) {
        return auctionHistoryRepository.findByMemberOrderByRegDateDesc(member);
    }

    /* 특정 경매에서 로그인한 사용자의 히스토리 조회*/
    public Optional<AuctionHistory> getAuctionHistoryForMember(Long auctionItemId, Long memberId) {
        return auctionHistoryRepository.findByAuctionItemIdAndMemberId(auctionItemId, memberId);
    }

     /* 히스토리 정보를 DTO로 변환*/
    public AuctionHistoryDto convertToDto(AuctionHistory history) {
        if (history == null) return null;

        String resultMessage = history.isWinner() ? "낙찰 성공!" : "낙찰 실패";

        // 대표 이미지 URL 조회
        String thumbnailUrl = itemRepository.findRepresentativeImageUrlByItemId(history.getAuctionItem().getItem().getItemId());

        return AuctionHistoryDto.builder()
                .historyId(history.getId())
                .auctionItemId(history.getAuctionItem().getId())
                .auctionItemName(history.getAuctionItem().getItem().getItemName())
                .auctionItemImage(thumbnailUrl)
                .myHighestBid(history.getMyHighestBid())
                .isWinner(history.isWinner())
                .finalPrice(history.getFinalPrice())
                .createdAt(history.getRegDate())
                .auctionEndTime(history.getAuctionItem().getEndTime())
                .resultMessage(resultMessage)
                .auctionWinStatus(history.getAuctionWinStatus())
                .build();
    }

}
