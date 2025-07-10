package com.petory.service.shop;

import com.petory.dto.shop.AuctionSessionDto;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.shop.AuctionSession;
import com.petory.repository.shop.AuctionSessionRepository;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.constant.AuctionSessionStatus;
import com.petory.constant.AuctionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuctionSessionService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionItemRepository auctionItemRepository;


     /* 경매 세션 생성*/
    @Transactional
    public AuctionSession createSession(AuctionItem auctionItem) {
        log.info("경매 세션 생성 시작: auctionItemId={}", auctionItem.getId());

        // 기존 세션이 있는지 확인
        Optional<AuctionSession> existingSession = auctionSessionRepository.findByAuctionItemId(auctionItem.getId());
        if (existingSession.isPresent()) {
            log.warn("이미 존재하는 세션: sessionId={}", existingSession.get().getId());
            return existingSession.get();
        }

        // 세션 키 생성 (UUID)
        String sessionKey = UUID.randomUUID().toString();

        // 세션 생성
        AuctionSession session = AuctionSession.builder()
                .auctionItem(auctionItem)
                .sessionKey(sessionKey)
                .participantCount(0)
                .status(AuctionSessionStatus.WAITING)
                .startTime(auctionItem.getStartTime())
                .endTime(auctionItem.getEndTime())
                .build();

        AuctionSession savedSession = auctionSessionRepository.save(session);
        log.info("경매 세션 생성 완료: sessionId={}, sessionKey={}", savedSession.getId(), sessionKey);

        return savedSession;
    }

    /**
     * 세션 조회 (ID로)
     */
    public Optional<AuctionSession> getSessionById(Long sessionId) {
        return auctionSessionRepository.findById(sessionId);
    }

    /**
     * 세션 조회 (세션 키로)
     */
    public Optional<AuctionSession> getSessionByKey(String sessionKey) {
        return auctionSessionRepository.findBySessionKey(sessionKey);
    }

    /**
     * 경매 상품으로 세션 조회
     */
    public Optional<AuctionSession> getSessionByAuctionItem(AuctionItem auctionItem) {
        return auctionSessionRepository.findByAuctionItemId(auctionItem.getId());
    }

    /**
     * 활성 세션 조회
     */
    public List<AuctionSession> getActiveSessions() {
        return auctionSessionRepository.findByStatus(AuctionSessionStatus.ACTIVE);
    }

    /**
     * 세션 상태 업데이트
     */
    @Transactional
    public void updateSessionStatus(Long sessionId, AuctionSessionStatus status) {
        log.info("세션 상태 업데이트: sessionId={}, status={}", sessionId, status);

        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus(status);
            auctionSessionRepository.save(session);
        });
    }

    /**
     * 참여자 수 업데이트
     */
    @Transactional
    public void updateParticipantCount(Long sessionId, int count) {
        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setParticipantCount(count);
            auctionSessionRepository.save(session);
        });
    }

    /**
     * 세션 종료
     */
    @Transactional
    public void endSession(Long sessionId) {
        log.info("세션 종료: sessionId={}", sessionId);

        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus(AuctionSessionStatus.ENDED);
            session.setEndTime(LocalDateTime.now());
            auctionSessionRepository.save(session);
        });
    }

    /**
     * 세션 활성화 상태 확인
     */
    public boolean isSessionActive(Long sessionId) {
        return auctionSessionRepository.findById(sessionId)
                .map(session -> session.getStatus() == AuctionSessionStatus.ACTIVE)
                .orElse(false);
    }

    /**
     * 세션 참여 가능 여부 확인 //필요한가? ? ??
     */
    public boolean canJoinSession(Long sessionId) {
        return auctionSessionRepository.findById(sessionId)
                .map(session -> {
                    boolean isActive = session.getStatus() == AuctionSessionStatus.ACTIVE;
                    boolean notFull = session.getParticipantCount() < 100; // 최대 참여자 수 제한
                    boolean notEnded = session.getEndTime().isAfter(LocalDateTime.now());
                    return isActive && notFull && notEnded;
                })
                .orElse(false);
    }

    /**
     * 남은 시간 계산 (초 단위)
     */
    public long getRemainingTime(Long sessionId) {
        return auctionSessionRepository.findById(sessionId)
                .map(session -> {
                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime endTime = session.getEndTime();

                    if (endTime.isBefore(now)) {
                        return 0L; // 이미 종료됨
                    }

                    return ChronoUnit.SECONDS.between(now, endTime);
                })
                .orElse(0L);
    }

    /**
     * 세션 정보를 DTO로 변환
     */
    public AuctionSessionDto convertToDto(AuctionSession session) {
        if (session == null) return null;

        long remainingTime = getRemainingTime(session.getId());

        return AuctionSessionDto.builder()
                .sessionId(session.getId())
                .auctionItemId(session.getAuctionItem().getId())
                .auctionItemName(session.getAuctionItem().getItem().getItemName())
                .auctionItemImage("") // TODO: ItemImage에서 메인 이미지 조회
                .sessionKey(session.getSessionKey())
                .participantCount(session.getParticipantCount())
                .status(session.getStatus())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .createdAt(session.getRegDate())
                .updatedAt(session.getUpdateDate())
                .startPrice(session.getAuctionItem().getStartPrice())
                .currentPrice(0) // TODO: AuctionBidRepository에서 조회
                .currentWinner("") // TODO: AuctionBidRepository에서 조회
                .isActive(session.getStatus() == AuctionSessionStatus.ACTIVE)
                .isFull(session.getParticipantCount() >= 100)
                .remainingTime(remainingTime)
                .build();
    }

    /**
     * 세션 삭제 (테스트용)
     */
    @Transactional
    public void deleteSession(Long sessionId) {
        log.info("세션 삭제: sessionId={}", sessionId);
        auctionSessionRepository.deleteById(sessionId);
    }

    /**
     * 경매 상품 ID로 세션 키 조회
     */
    public String getSessionKey(Long auctionItemId) {
        return auctionSessionRepository.findByAuctionItemId(auctionItemId)
                .map(AuctionSession::getSessionKey)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경매 세션입니다: " + auctionItemId));
    }

    /**
     * 오래된 세션 정리 (정리용)
     */
    @Transactional
    public void cleanupOldSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(7);
        List<AuctionSession> oldSessions = auctionSessionRepository.findByStatusAndEndTimeBefore(AuctionSessionStatus.ENDED, cutoffTime);

        for (AuctionSession session : oldSessions) {
            auctionSessionRepository.delete(session);
            log.info("오래된 세션 삭제: sessionId={}", session.getId());
        }
    }

    /**
     * 앞으로 5분 이내에 시작되는 경매가 있는지 확인하고 세션 자동 생성 (스케줄러)
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 * * * * *") // 1분마다 실행
    @Transactional
    public void createSessionsForScheduledAuctions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fiveMinutesFromNow = now.plusMinutes(5);
        
        log.info("=== 경매 세션 스케줄러 실행: {} ===", now);
        
        // 앞으로 5분 이내에 시작되는 SCHEDULED 상태의 경매 조회
        List<AuctionItem> itemsToCreateSession = auctionItemRepository
            .findByStartTimeBetweenAndAuctionStatus(now, fiveMinutesFromNow, AuctionStatus.SCHEDULED);
        
        log.info("5분 이내 시작할 경매: {}개", itemsToCreateSession.size());
        
        for (AuctionItem item : itemsToCreateSession) {
            // 세션이 이미 없으면 생성
            if (!auctionSessionRepository.existsByAuctionItemId(item.getId())) {
                createSession(item); // WAITING 상태로 생성됨
                log.info("✅ 세션 생성 완료: auctionItemId={}, startTime={}", item.getId(), item.getStartTime());
            } else {
                log.info("⏭️ 이미 세션 존재: auctionItemId={}", item.getId());
            }
        }
        
        // 경매 시작 시간이 된 WAITING 상태의 세션을 ACTIVE로 변경
        List<AuctionSession> sessionsToStart = auctionSessionRepository
            .findSessionsToStart(AuctionSessionStatus.WAITING, now);
        
        log.info("시작할 세션: {}개", sessionsToStart.size());
        
        for (AuctionSession session : sessionsToStart) {
            session.setStatus(AuctionSessionStatus.ACTIVE);
            auctionSessionRepository.save(session);
            
            // 경매 상품 상태도 ACTIVE로 변경
            AuctionItem item = session.getAuctionItem();
            item.setAuctionStatus(AuctionStatus.ACTIVE);
            auctionItemRepository.save(item);
            
            log.info("✅ 경매 시작: sessionId={}, auctionItemId={}", session.getId(), item.getId());
        }
        
        // 경매 종료 시간이 된 ACTIVE 상태의 세션을 ENDED로 변경
        List<AuctionSession> sessionsToEnd = auctionSessionRepository
            .findSessionsToEnd(AuctionSessionStatus.ACTIVE, now);
        
        log.info("종료할 세션: {}개", sessionsToEnd.size());
        
        for (AuctionSession session : sessionsToEnd) {
            session.setStatus(AuctionSessionStatus.ENDED);
            auctionSessionRepository.save(session);
            
            // 경매 상품 상태도 ENDED로 변경
            AuctionItem item = session.getAuctionItem();
            item.setAuctionStatus(AuctionStatus.ENDED);
            auctionItemRepository.save(item);
            
            log.info("✅ 경매 종료: sessionId={}, auctionItemId={}", session.getId(), item.getId());
        }
    }
}
