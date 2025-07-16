package com.petory.service.shop;

import com.petory.dto.shop.AuctionDeliveryDto;
import com.petory.dto.shop.AuctionDeliveryRequestDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionDelivery;
import com.petory.entity.shop.AuctionHistory;
import com.petory.repository.shop.AuctionDeliveryRepository;
import com.petory.repository.shop.AuctionHistoryRepository;
import com.petory.constant.AuctionWinStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuctionDeliveryService {

    private final AuctionDeliveryRepository auctionDeliveryRepository;
    private final AuctionHistoryRepository auctionHistoryRepository;

    /**
     * 경매 종료 시 낙찰자에 대한 배송 정보 생성
     */
    @Transactional
    public AuctionDelivery createDelivery(AuctionHistory history, LocalDateTime deadline) {
        log.info("배송 정보 생성: historyId={}, deadline={}", history.getId(), deadline);

        // 이미 배송 정보가 있는지 확인
        Optional<AuctionDelivery> existingDelivery = auctionDeliveryRepository.findByAuctionHistory(history);
        if (existingDelivery.isPresent()) {
            log.warn("이미 존재하는 배송 정보: deliveryId={}", existingDelivery.get().getId());
            return existingDelivery.get();
        }

        // 배송 정보 생성
        AuctionDelivery delivery = AuctionDelivery.builder()
                .auctionHistory(history)
                .deliveryDeadline(deadline)
                .build();

        AuctionDelivery savedDelivery = auctionDeliveryRepository.save(delivery);
        log.info("배송 정보 생성 완료: deliveryId={}", savedDelivery.getId());

        return savedDelivery;
    }

    /**
     * 배송지 정보 입력
     */
    @Transactional
    public void inputDeliveryAddress(Long historyId, AuctionDeliveryRequestDto requestDto, Long memberId) {
        log.info("배송지 정보 입력: historyId={}, memberId={}", historyId, memberId);

        // AuctionHistory 조회
        AuctionHistory history = auctionHistoryRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("AuctionHistory not found: " + historyId));

        // 본인 확인
        if (!history.getMember().getMemberId().equals(memberId)) {
            throw new IllegalStateException("본인만 배송지 입력이 가능합니다.");
        }

        // 낙찰자 확인
        if (!history.isWinner()) {
            throw new IllegalStateException("낙찰자만 배송지 입력이 가능합니다.");
        }

        // 배송 정보 조회 또는 생성
        AuctionDelivery delivery = auctionDeliveryRepository.findByAuctionHistory(history)
                .orElseGet(() -> createDelivery(history, LocalDateTime.now().plusDays(5)));

        // 배송지 정보 업데이트
        delivery.setReceiverName(requestDto.getReceiverName());
        delivery.setReceiverPhone(requestDto.getReceiverPhone());
        delivery.setDeliveryAddress(requestDto.getDeliveryAddress());
        delivery.setDeliveryAddressDetail(requestDto.getDeliveryAddressDetail());
        delivery.setDeliveryMemo(requestDto.getDeliveryMemo());
        delivery.setDeliveryName(requestDto.getDeliveryName());
        delivery.setDeliveryInputAt(LocalDateTime.now());

        // AuctionHistory 상태 업데이트
        history.setAuctionWinStatus(AuctionWinStatus.DELIVERED);
        auctionHistoryRepository.save(history);

        auctionDeliveryRepository.save(delivery);
        log.info("배송지 정보 입력 완료: deliveryId={}", delivery.getId());
    }

    /**
     * 배송 정보 조회
     */
    public Optional<AuctionDeliveryDto> getDeliveryByHistoryId(Long historyId, Long memberId) {
        Optional<AuctionDelivery> deliveryOpt = auctionDeliveryRepository.findByAuctionHistoryId(historyId);
        if (deliveryOpt.isPresent()) {
            AuctionDelivery delivery = deliveryOpt.get();
            if (!delivery.getAuctionHistory().getMember().getMemberId().equals(memberId)) {
                throw new IllegalStateException("본인만 배송 정보를 조회할 수 있습니다.");
            }
            return Optional.of(convertToDto(delivery));
        }
        return Optional.empty();
    }

    /**
     * 사용자의 배송 정보 조회
     */
    public List<AuctionDeliveryDto> getDeliveriesByMemberId(Long memberId) {
        return auctionDeliveryRepository.findByMemberId(memberId)
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    /**
     * 마감일이 지났는데 배송지 미입력 건 자동 취소 (매일 0시)
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cancelExpiredDeliveries() {
        LocalDateTime now = LocalDateTime.now();
        List<AuctionDelivery> expiredDeliveries = auctionDeliveryRepository.findExpiredUnclaimedDeliveries(now);

        log.info("만료된 배송지 미입력 건 처리 시작: {}건", expiredDeliveries.size());

        for (AuctionDelivery delivery : expiredDeliveries) {
            AuctionHistory history = delivery.getAuctionHistory();
            history.setAuctionWinStatus(AuctionWinStatus.CANCELLED);
            auctionHistoryRepository.save(history);
            
            log.info("배송지 미입력으로 인한 취소: historyId={}, deliveryId={}", 
                    history.getId(), delivery.getId());
        }

        if (!expiredDeliveries.isEmpty()) {
            log.info("만료된 배송지 미입력 건 처리 완료: {}건 취소", expiredDeliveries.size());
        }
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private AuctionDeliveryDto convertToDto(AuctionDelivery delivery) {
        if (delivery == null) return null;

        return AuctionDeliveryDto.builder()
                .deliveryId(delivery.getId())
                .historyId(delivery.getAuctionHistory().getId())
                .receiverName(delivery.getReceiverName())
                .receiverPhone(delivery.getReceiverPhone())
                .deliveryAddress(delivery.getDeliveryAddress())
                .deliveryAddressDetail(delivery.getDeliveryAddressDetail())
                .deliveryMemo(delivery.getDeliveryMemo())
                .deliveryName(delivery.getDeliveryName())
                .deliveryInputAt(delivery.getDeliveryInputAt())
                .deliveryDeadline(delivery.getDeliveryDeadline())
                .auctionWinStatus(delivery.getAuctionHistory().getAuctionWinStatus().name())
                .build();
    }
}
