package com.petory.service.shop;

import com.petory.constant.AuctionBidStatus;
import com.petory.dto.shop.AuctionBidDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionBid;
import com.petory.entity.shop.AuctionItem;
import com.petory.repository.shop.AuctionBidRepository;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.petory.entity.shop.AuctionHistory;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionBidService {

    private final AuctionBidRepository auctionBidRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final MemberRepository memberRepository;
    private final AuctionParticipantService auctionParticipantService;
    private final AuctionHistoryService auctionHistoryService;
    private final AuctionDeliveryService auctionDeliveryService;

    // @Autowired 제거

    private static final int MAX_RETRY_COUNT = 3;

    /*
     * 입찰 처리 (동시성 제어 포함)
     *
     * 5분 경매 특성상 단순한 마일리지 검증:
     * 1. 입찰 시 마일리지 잔액 확인
     * 2. 낙찰 시 실제 마일리지 차감
     * 3. 짧은 시간이므로 예약 시스템 불필요
     */
    @Transactional
    public AuctionBid placeBid(Long auctionItemId, Member member, Integer bidAmount) {
        log.info("입찰 처리 시작: auctionItemId={}, memberId={}, bidAmount={}",
                auctionItemId, member.getMemberId(), bidAmount);

        int retryCount = 0;
        while (retryCount < MAX_RETRY_COUNT) {
            try {
                return processBid(auctionItemId, member, bidAmount);
            } catch (OptimisticLockingFailureException e) {
                retryCount++;
                log.warn("동시 입찰 감지 - 재시도 {}: auctionItemId={}, memberId={}, error={}",
                        retryCount, auctionItemId, member.getMemberId(), e.getMessage());

                if (retryCount >= MAX_RETRY_COUNT) {
                    throw new IllegalStateException("동시 입찰이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                }

                // 잠시 대기 후 재시도
                try {
                    Thread.sleep(100 * retryCount); // 재시도마다 대기 시간 증가
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("입찰 처리 중 중단되었습니다.");
                }
            }
        }

        throw new IllegalStateException("입찰 처리에 실패했습니다.");
    }

    /*
     * 실제 입찰 처리 로직
     */
    private AuctionBid processBid(Long auctionItemId, Member member, Integer bidAmount) {
        // 경매 상품 조회 (버전 정보 포함)
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

        // 마일리지 잔액 확인 (5분 경매이므로 단순 검증)
        validateMileageBalance(member, bidAmount);

        // 현재 최고가 확인 (동시성 고려)
        Optional<Integer> currentHighestBid = getCurrentHighestBid(auctionItem);
        if (currentHighestBid.isPresent() && bidAmount <= currentHighestBid.get()) {
            throw new IllegalArgumentException("현재 최고가보다 높은 금액으로 입찰해야 합니다. 현재 최고가: " + currentHighestBid.get() + "P");
        }

        // 입찰 기록 생성
        AuctionBid bid = AuctionBid.builder()
                .auctionItem(auctionItem)
                .member(member)
                .bidAmount(bidAmount)
                .bidTime(LocalDateTime.now())
                .bidStatus(AuctionBidStatus.SUCCESS) // 반드시 명시적으로 할당
                .build();

        AuctionBid savedBid = auctionBidRepository.save(bid);

        // 경매 상품 현재 가격 업데이트 (버전 체크 포함)
        auctionItem.setCurrentPrice(bidAmount);
        auctionItemRepository.save(auctionItem);
        log.info("경매 상품 현재 가격 업데이트: auctionItemId={}, newPrice={}, version={}",
                auctionItem.getId(), bidAmount, auctionItem.getVersion());

        // 참여자 입찰 정보 업데이트
        auctionParticipantService.updateBidInfo(auctionItem.getId(), member, bidAmount);

        log.info("입찰 완료: bidId={}, currentPrice={}", savedBid.getId(), bidAmount);

        return savedBid;
    }

    /*
     * 입찰 처리 후 DTO 반환 (트랜잭션 안에서 LAZY 필드 접근)
     */
    @Transactional
    public AuctionBidDto placeBidAndReturnDto(Long auctionItemId, Member member, Integer bidAmount) {
        AuctionBid bid = placeBid(auctionItemId, member, bidAmount);
        return convertToDto(bid);
    }

    /*
     * 현재 최고 입찰가 조회
     */
    public Optional<Integer> getCurrentHighestBid(AuctionItem auctionItem) {
        return auctionBidRepository.findMaxBidAmountByAuctionItem(auctionItem);
    }

    /*
     * 현재 최고 입찰자 조회
     */
    public Optional<Member> getCurrentHighestBidder(AuctionItem auctionItem) {
        return auctionBidRepository.findCurrentWinnerByAuctionItem(auctionItem);
    }

    /*
     * 특정 경매의 모든 입찰 내역 조회
     */
    public List<AuctionBid> getBidHistory(AuctionItem auctionItem) {
        return auctionBidRepository.findByAuctionItemOrderByBidTimeDesc(auctionItem);
    }

    /*
     * 특정 사용자의 입찰 내역 조회
     */
    public List<AuctionBid> getUserBidHistory(AuctionItem auctionItem, Member member) {
        return auctionBidRepository.findByAuctionItemAndMemberOrderByBidTimeDesc(auctionItem, member);
    }

    /*
     * 특정 경매의 입찰 횟수 조회
     */
    public long getBidCount(AuctionItem auctionItem) {
        return auctionBidRepository.countByAuctionItem(auctionItem);
    }

    /*
     * 특정 사용자의 입찰 횟수 조회
     */
    public long getUserBidCount(AuctionItem auctionItem, Member member) {
        return auctionBidRepository.countByAuctionItem(auctionItem);
    }

    /*
     * 입찰가 유효성 검사
     */
    private void validateBidAmount(AuctionItem auctionItem, Integer bidAmount) {
        // 최소 입찰가 확인 (시작가 + 입찰 단위)
        Integer minBidAmount = auctionItem.getStartPrice() + (auctionItem.getBidUnit() != null ? auctionItem.getBidUnit() : 100);

        if (bidAmount < minBidAmount) {
            throw new IllegalArgumentException("최소 입찰가는 " + minBidAmount + "원입니다.");
        }

        // 최대 입찰가 확인 (시작가의 20배)
        Integer maxBidAmount = auctionItem.getStartPrice() * 20;
        if (bidAmount > maxBidAmount) {
            throw new IllegalArgumentException("최대 입찰가는 " + maxBidAmount + "P입니다.");
        }
    }

    /*
     * 마일리지 잔액 확인
     */
    private void validateMileageBalance(Member member, Integer bidAmount) {
        if (member.getMember_Mileage() < bidAmount) {
            throw new IllegalArgumentException("마일리지가 부족합니다. 현재 마일리지: " + member.getMember_Mileage() + "P, 필요 마일리지: " + bidAmount + "P");
        }
    }

    /*
     * 경매 활성화 상태 확인
     */
    private boolean isAuctionActive(AuctionItem auctionItem) {
        LocalDateTime now = LocalDateTime.now();
        return auctionItem.getStartTime().isBefore(now) &&
               auctionItem.getEndTime().isAfter(now) &&
               auctionItem.getAuctionStatus().name().equals("ACTIVE");
    }


     /* 입찰 정보를 DTO로 변환*/
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
                .status(bid.getBidStatus()) // DB에 저장된 실제 상태 사용
                .build();
    }

    /*
     * 최고가 입찰인지 확인
     */
    private boolean isHighestBid(AuctionBid bid) {
        Optional<Integer> maxBid = getCurrentHighestBid(bid.getAuctionItem());
        return maxBid.map(max -> bid.getBidAmount().equals(max)).orElse(false);
    }

    /*
     * 입찰 취소 (테스트용)
     */
    @Transactional
    public void cancelBid(Long bidId) {
        log.info("입찰 취소: bidId={}", bidId);
        auctionBidRepository.deleteById(bidId);
    }

    /*
     * 경매 강제 종료 시 모든 입찰을 CANCELED 상태로 변경
     */
    @Transactional
    public void cancelAllBidsForAuction(Long auctionItemId) {
        log.info("경매 강제 종료 - 모든 입찰 취소: auctionItemId={}", auctionItemId);

        Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
        if (auctionItemOpt.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 경매입니다: " + auctionItemId);
        }

        AuctionItem auctionItem = auctionItemOpt.get();
        List<AuctionBid> bids = auctionBidRepository.findByAuctionItemOrderByBidTimeDesc(auctionItem);

        for (AuctionBid bid : bids) {
            bid.setBidStatus(AuctionBidStatus.CANCELED);
        }

        auctionBidRepository.saveAll(bids);
        log.info("경매 강제 종료 완료: auctionItemId={}, canceledBids={}", auctionItemId, bids.size());
    }

    /*
     * 경매 종료 시 낙찰자 마일리지 차감 (5분 경매용)
     */
    @Transactional
    public void processAuctionEnd(Long auctionItemId) {
        log.info("경매 종료 처리: auctionItemId={}", auctionItemId);

        Optional<AuctionItem> auctionItemOpt = auctionItemRepository.findById(auctionItemId);
        if (auctionItemOpt.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 경매입니다: " + auctionItemId);
        }

        AuctionItem auctionItem = auctionItemOpt.get();

        // 현재 최고 입찰자 조회
        Optional<Member> winnerOpt = getCurrentHighestBidder(auctionItem);
        if (winnerOpt.isEmpty()) {
            log.info("경매 종료: 입찰자가 없음 - auctionItemId={}", auctionItemId);
            return;
        }

        Member winner = winnerOpt.get();
        Optional<Integer> winningBidOpt = getCurrentHighestBid(auctionItem);
        if (winningBidOpt.isEmpty()) {
            log.info("경매 종료: 입찰 기록이 없음 - auctionItemId={}", auctionItemId);
            return;
        }

        Integer winningBidAmount = winningBidOpt.get();

        // 낙찰자 마일리지 차감 (5분 경매이므로 단순 처리)
        if (winner.getMember_Mileage() < winningBidAmount) {
            log.error("경매 종료 실패: 낙찰자 마일리지 부족 - memberId={}, required={}, available={}",
                    winner.getMemberId(), winningBidAmount, winner.getMember_Mileage());
            throw new IllegalStateException("낙찰자의 마일리지가 부족합니다. 낙찰가: " + winningBidAmount + "P, 보유 마일리지: " + winner.getMember_Mileage() + "P");
        }

        winner.setMember_Mileage(winner.getMember_Mileage() - winningBidAmount);
        memberRepository.save(winner);

        log.info("경매 종료 완료: auctionItemId={}, winnerId={}, winningBid={}, remainingMileage={}",
                auctionItemId, winner.getMemberId(), winningBidAmount, winner.getMember_Mileage());

        // === [추가] 모든 참여자에 대해 AuctionHistory 생성 ===
        List<AuctionBid> allBids = auctionBidRepository.findByAuctionItemOrderByBidTimeDesc(auctionItem);
        // 중복 없는 참여자 리스트 추출
        List<Member> participants = allBids.stream()
            .map(AuctionBid::getMember)
            .distinct()
            .toList();
        for (Member member : participants) {
            boolean isWinner = member.getMemberId().equals(winner.getMemberId());
            // 내 최고 입찰가
            Integer myHighestBid = auctionBidRepository.findMaxBidAmountByAuctionItemAndMember(auctionItem, member).orElse(0);
            // 최종 낙찰가 (경매의 최고 입찰가)
            Integer finalPrice = winningBidAmount;
            AuctionHistory history = auctionHistoryService.createHistory(auctionItem, member, finalPrice, isWinner, isWinner ? com.petory.constant.AuctionWinStatus.WIN : null);

            // 낙찰자인 경우 AuctionDelivery 생성
            if (isWinner && history != null) {
                auctionDeliveryService.createDelivery(history, LocalDateTime.now().plusDays(5));
            }
        }
    }
}
