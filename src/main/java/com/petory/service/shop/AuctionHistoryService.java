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

    /**
     * 경매 히스토리 생성 (경매 종료 시)
     */
    @Transactional
    public AuctionHistory createHistory(AuctionItem auctionItem, Member member, Integer finalPrice, boolean isWinner, com.petory.constant.AuctionWinStatus auctionWinStatus) {
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

    /**
     * 사용자의 경매 히스토리 조회
     */
    public List<AuctionHistory> getUserHistory(Member member) {
        return auctionHistoryRepository.findByMemberOrderByRegDateDesc(member);
    }

    /**
     * 사용자의 낙찰 성공 히스토리 조회
     */
    public List<AuctionHistory> getUserWinHistory(Member member) {
        return auctionHistoryRepository.findByMemberAndIsWinnerTrue(member);
    }

    /**
     * 사용자의 낙찰 실패 히스토리 조회
     */
    public List<AuctionHistory> getUserLoseHistory(Member member) {
        return auctionHistoryRepository.findByMemberAndIsWinnerFalse(member);
    }

    /**
     * 특정 경매의 모든 히스토리 조회
     */
    public List<AuctionHistory> getAuctionHistory(AuctionItem auctionItem) {
        return auctionHistoryRepository.findByAuctionItemOrderByRegDateDesc(auctionItem);
    }

    /**
     * 특정 경매의 낙찰자 히스토리 조회
     */
    public Optional<AuctionHistory> getAuctionWinner(AuctionItem auctionItem) {
        return auctionHistoryRepository.findByAuctionItemAndIsWinnerTrue(auctionItem);
    }

    /**
     * 특정 경매에서 로그인한 사용자의 히스토리 조회
     */
    public Optional<AuctionHistory> getAuctionHistoryForMember(Long auctionItemId, Long memberId) {
        return auctionHistoryRepository.findByAuctionItemIdAndMemberId(auctionItemId, memberId);
    }

    /**
     * 사용자의 경매 참여 횟수 조회
     */
    public long getUserParticipantCount(Member member) {
        return auctionHistoryRepository.countByMember(member);
    }

    /**
     * 사용자의 낙찰 성공 횟수 조회
     */
    public long getUserWinCount(Member member) {
        return auctionHistoryRepository.countByMemberAndIsWinnerTrue(member);
    }

    /**
     * 사용자의 낙찰률 조회
     */
    public double getUserWinRate(Member member) {
        Optional<Double> winRateOpt = auctionHistoryRepository.findWinRateByMember(member);
        return winRateOpt.orElse(0.0);
    }

    /**
     * 사용자의 최고 입찰가 조회
     */
    public Optional<Integer> getUserMaxBid(Member member) {
        return auctionHistoryRepository.findMaxBidByMember(member);
    }

    /**
     * 사용자의 평균 입찰가 조회
     */
    public Optional<Double> getUserAverageBid(Member member) {
        return auctionHistoryRepository.findAverageBidByMember(member);
    }

    /**
     * 특정 경매의 최고 입찰가 조회
     */
    public Optional<Integer> getAuctionMaxBid(AuctionItem auctionItem) {
        return auctionHistoryRepository.findMaxBidByAuctionItem(auctionItem);
    }

    /**
     * 특정 경매의 평균 입찰가 조회
     */
    public Optional<Double> getAuctionAverageBid(AuctionItem auctionItem) {
        return auctionHistoryRepository.findAverageBidByAuctionItem(auctionItem);
    }

    /**
     * 특정 시간 범위의 히스토리 조회
     */
    public List<AuctionHistory> getHistoryByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        return auctionHistoryRepository.findByRegDateBetween(startTime, endTime);
    }

    /**
     * 사용자의 특정 시간 범위 히스토리 조회 // 특정 일자에 참여했던 경매 히스토리
     */
    public List<AuctionHistory> getUserHistoryByTimeRange(Member member, LocalDateTime startTime, LocalDateTime endTime) {
        return auctionHistoryRepository.findByMemberAndRegDateBetween(member, startTime, endTime);
    }

    /**
     * 히스토리 존재 여부 확인
     */
    public boolean existsHistory(AuctionItem auctionItem, Member member) {
        return auctionHistoryRepository.findByAuctionItemIdAndMemberId(auctionItem.getId(), member.getMemberId()).isPresent();
    }

    /**
     * 낙찰자 존재 여부 확인
     */
    public boolean existsWinner(AuctionItem auctionItem) {
        return auctionHistoryRepository.existsByAuctionItemAndIsWinnerTrue(auctionItem);
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

    /**
     * 경매 히스토리 삭제 (테스트용)
     */
    @Transactional
    public void deleteHistory(Long historyId) {
        log.info("히스토리 삭제: historyId={}", historyId);
        auctionHistoryRepository.deleteById(historyId);
    }

    /**
     * 특정 경매의 모든 히스토리 삭제
     */
    @Transactional
    public void deleteAuctionHistory(AuctionItem auctionItem) {
        log.info("경매 히스토리 삭제: auctionItemId={}", auctionItem.getId());
        auctionHistoryRepository.deleteByAuctionItem(auctionItem);
    }

    /**
     * 사용자의 모든 히스토리 삭제
     */
    @Transactional
    public void deleteUserHistory(Member member) {
        log.info("사용자 히스토리 삭제: memberId={}", member.getMemberId());
        auctionHistoryRepository.deleteByMember(member);
    }

    /**
     * 오래된 히스토리 정리 (정리용)
     */
    @Transactional
    public void cleanupOldHistory() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMonths(6); // 6개월 이전 히스토리 정리
        auctionHistoryRepository.deleteByRegDateBefore(cutoffTime);
        log.info("오래된 히스토리 정리 완료");
    }

    // 아래 메서드들은 AuctionHistory에서 배송 관련 필드가 제거되었으므로 삭제
    //
    // @Transactional
    // public void inputDelivery(Long historyId, String deliveryAddress, Member member) { ... }
    //
    // @Scheduled(cron = "0 0 0 * * *")
    // @Transactional
    // public void cancelUnclaimedAuctionWins() { ... }
}
