package com.petory.service.shop;

import com.petory.constant.AuctionBidStatus;
import com.petory.dto.shop.AuctionBidDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionBid;
import com.petory.entity.shop.AuctionItem;
import com.petory.repository.shop.AuctionBidRepository;
import com.petory.repository.shop.AuctionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuctionBidService {

    private final AuctionBidRepository auctionBidRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final AuctionParticipantService auctionParticipantService;

    /**
     * 입찰 처리
     */
    @Transactional
    public AuctionBid placeBid(Long auctionItemId, Member member, Integer bidAmount) {
        log.info("입찰 처리: auctionItemId={}, memberId={}, bidAmount={}", 
                auctionItemId, member.getMemberId(), bidAmount);
        
        // 경매 상품 조회
        Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
        if (auctionItemOpt.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 경매입니다: " + auctionItemId);
        }
        
        AuctionItem auctionItem = auctionItemOpt.get();
        
        // 경매 상태 확인
        if (!isAuctionActive(auctionItem)) {
            throw new IllegalStateException("진행 중인 경매가 아닙니다: " + auctionItemId);
        }
        
        // 입찰가 유효성 검사
        validateBidAmount(auctionItem, bidAmount);
        
        // 입찰 기록 생성
        AuctionBid bid = AuctionBid.builder()
                .auctionItem(auctionItem)
                .member(member)
                .bidAmount(bidAmount)
                .bidTime(LocalDateTime.now())
                .build();
        
        AuctionBid savedBid = auctionBidRepository.save(bid);
        
        // 경매 상품 정보 업데이트 (현재는 로그만)
        log.info("입찰 완료: auctionItemId={}, bidAmount={}, bidder={}", 
                auctionItem.getId(), bidAmount, member.getMember_NickName());
        
        // 참여자 입찰 정보 업데이트
        auctionParticipantService.updateBidInfo(auctionItem.getId(), member, bidAmount);
        
        log.info("입찰 완료: bidId={}, currentPrice={}", savedBid.getId(), bidAmount);
        
        return savedBid;
    }

    /**
     * 현재 최고 입찰가 조회
     */
    public Optional<Integer> getCurrentHighestBid(AuctionItem auctionItem) {
        return auctionBidRepository.findMaxBidAmountByAuctionItem(auctionItem);
    }

    /**
     * 현재 최고 입찰자 조회
     */
    public Optional<Member> getCurrentHighestBidder(AuctionItem auctionItem) {
        return auctionBidRepository.findCurrentWinnerByAuctionItem(auctionItem);
    }

    /**
     * 특정 경매의 모든 입찰 내역 조회
     */
    public List<AuctionBid> getBidHistory(AuctionItem auctionItem) {
        return auctionBidRepository.findByAuctionItemOrderByBidTimeDesc(auctionItem);
    }

    /**
     * 특정 사용자의 입찰 내역 조회
     */
    public List<AuctionBid> getUserBidHistory(AuctionItem auctionItem, Member member) {
        return auctionBidRepository.findByAuctionItemAndMemberOrderByBidTimeDesc(auctionItem, member);
    }

    /**
     * 특정 경매의 입찰 횟수 조회
     */
    public long getBidCount(AuctionItem auctionItem) {
        return auctionBidRepository.countByAuctionItem(auctionItem);
    }

    /**
     * 특정 사용자의 입찰 횟수 조회
     */
    public long getUserBidCount(AuctionItem auctionItem, Member member) {
        return auctionBidRepository.countByAuctionItem(auctionItem);
    }

    /**
     * 입찰가 유효성 검사
     */
    private void validateBidAmount(AuctionItem auctionItem, Integer bidAmount) {
        // 최소 입찰가 확인 (시작가 + 입찰 단위)
        Integer minBidAmount = auctionItem.getStartPrice() + (auctionItem.getBidUnit() != null ? auctionItem.getBidUnit() : 100);
        
        if (bidAmount < minBidAmount) {
            throw new IllegalArgumentException("최소 입찰가는 " + minBidAmount + "원입니다.");
        }
        
        // 최대 입찰가 확인 (예: 시작가의 10배)
        Integer maxBidAmount = auctionItem.getStartPrice() * 10;
        if (bidAmount > maxBidAmount) {
            throw new IllegalArgumentException("최대 입찰가는 " + maxBidAmount + "원입니다.");
        }
    }

    /**
     * 경매 활성화 상태 확인
     */
    private boolean isAuctionActive(AuctionItem auctionItem) {
        LocalDateTime now = LocalDateTime.now();
        return auctionItem.getStartTime().isBefore(now) && 
               auctionItem.getEndTime().isAfter(now) &&
               auctionItem.getAuctionStatus().name().equals("ACTIVE");
    }

    /**
     * 입찰 정보를 DTO로 변환
     */
    public AuctionBidDto convertToDto(AuctionBid bid) {
        if (bid == null) return null;
        
        return AuctionBidDto.builder()
                .bidId(bid.getId())
                .auctionItemId(bid.getAuctionItem().getId())
                .auctionItemName(bid.getAuctionItem().getItem().getItemName())
                .memberId(bid.getMember().getMemberId())
                .memberNickname(bid.getMember().getMember_NickName())
                .bidAmount(bid.getBidAmount())
                .bidTime(bid.getBidTime())
                .isHighest(isHighestBid(bid))
                .status(AuctionBidStatus.SUCCESS)
                .build();
    }

    /**
     * 최고가 입찰인지 확인
     */
    private boolean isHighestBid(AuctionBid bid) {
        Optional<Integer> maxBid = getCurrentHighestBid(bid.getAuctionItem());
        return maxBid.map(max -> bid.getBidAmount().equals(max)).orElse(false);
    }

    /**
     * 입찰 취소 (테스트용)
     */
    @Transactional
    public void cancelBid(Long bidId) {
        log.info("입찰 취소: bidId={}", bidId);
        auctionBidRepository.deleteById(bidId);
    }
} 