package com.petory.service.shop;

import com.petory.dto.shop.AuctionSessionDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.shop.AuctionSession;
import com.petory.repository.shop.AuctionSessionRepository;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.repository.shop.AuctionParticipantRepository;
import com.petory.constant.AuctionSessionStatus;
import com.petory.constant.AuctionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AuctionSessionService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final AuctionBidService auctionBidService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AuctionSessionService(
            AuctionSessionRepository auctionSessionRepository,
            AuctionItemRepository auctionItemRepository,
            AuctionParticipantRepository auctionParticipantRepository,
            @Lazy AuctionBidService auctionBidService,
            SimpMessagingTemplate messagingTemplate) {
        this.auctionSessionRepository = auctionSessionRepository;
        this.auctionItemRepository = auctionItemRepository;
        this.auctionParticipantRepository = auctionParticipantRepository;
        this.auctionBidService = auctionBidService;
        this.messagingTemplate = messagingTemplate;
    }


     /* 경매 세션 생성*/
    @Transactional
    public AuctionSession createSession(AuctionItem auctionItem) {
        return createSession(auctionItem, false);
    }

    @Transactional
    public AuctionSession createSession(AuctionItem auctionItem, boolean forceActive) {
        log.info("경매 세션 생성 시작: auctionItemId={}, forceActive={}", auctionItem.getId(), forceActive);

        Optional<AuctionSession> existingSession = auctionSessionRepository.findByAuctionItemId(auctionItem.getId());
        if (existingSession.isPresent()) {
            AuctionSession session = existingSession.get();
            if (forceActive && session.getStatus() != AuctionSessionStatus.ACTIVE) {
                session.setStatus(AuctionSessionStatus.ACTIVE);
                auctionSessionRepository.save(session);
            }
            return session;
        }

        String sessionKey = UUID.randomUUID().toString();
        AuctionSessionStatus status = forceActive ? AuctionSessionStatus.ACTIVE : AuctionSessionStatus.WAITING;

        AuctionSession session = AuctionSession.builder()
                .auctionItem(auctionItem)
                .sessionKey(sessionKey)
                .participantCount(0)
                .status(status)
                .startTime(auctionItem.getStartTime())
                .endTime(auctionItem.getEndTime())
                .build();

        AuctionSession savedSession = auctionSessionRepository.save(session);
        log.info("경매 세션 생성 완료: sessionId={}, sessionKey={}, status={}", savedSession.getId(), sessionKey, status);

        return savedSession;
    }

    /* 세션 조회 (ID로)*/
    public Optional<AuctionSession> getSessionById(Long sessionId) {
        return auctionSessionRepository.findById(sessionId);
    }

    /* 세션 조회 (세션 키로)*/
    public Optional<AuctionSession> getSessionByKey(String sessionKey) {
        return auctionSessionRepository.findBySessionKey(sessionKey);
    }

    /* 경매 상품으로 세션 조회*/
    public Optional<AuctionSession> getSessionByAuctionItem(AuctionItem auctionItem) {
        return auctionSessionRepository.findByAuctionItemId(auctionItem.getId());
    }

    /* 활성 세션 조회*/
    public List<AuctionSession> getActiveSessions() {
        return auctionSessionRepository.findByStatus(AuctionSessionStatus.ACTIVE);
    }

    /* 세션 상태 업데이트*/
    @Transactional
    public void updateSessionStatus(Long sessionId, AuctionSessionStatus status) {
        log.info("세션 상태 업데이트: sessionId={}, status={}", sessionId, status);

        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus(status);
            auctionSessionRepository.save(session);
        });
    }

    /* 참여자 수 업데이트*/
    @Transactional
    public void updateParticipantCount(Long sessionId, int count) {
        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setParticipantCount(count);
            auctionSessionRepository.save(session);
        });
    }

    /* 세션 종료*/
    @Transactional
    public void endSession(Long sessionId) {
        log.info("세션 종료: sessionId={}", sessionId);

        auctionSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus(AuctionSessionStatus.ENDED);
            session.setEndTime(LocalDateTime.now());
            auctionSessionRepository.save(session);
        });
    }

    /* 세션 활성화 상태 확인*/
    public boolean isSessionActive(Long sessionId) {
        return auctionSessionRepository.findById(sessionId)
                .map(session -> session.getStatus() == AuctionSessionStatus.ACTIVE)
                .orElse(false);
    }

    /* 세션 참여 가능 여부 확인*/
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

    /* 남은 시간 계산 (초 단위)*/
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

    /* 세션 정보를 DTO로 변환*/
    public AuctionSessionDto convertToDto(AuctionSession session) {
        if (session == null) return null;

        long remainingTime = getRemainingTime(session.getId());

        return AuctionSessionDto.builder()
                .sessionId(session.getId())
                .auctionItemId(session.getAuctionItem().getId())
                .sessionKey(session.getSessionKey())
                .participantCount(session.getParticipantCount())
                .status(session.getStatus())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .createdAt(session.getRegDate())
                .updatedAt(session.getUpdateDate())
                .isActive(session.getStatus() == AuctionSessionStatus.ACTIVE)
                .isFull(session.getParticipantCount() >= 100)
                .remainingTime(remainingTime)
                .build();
    }



    /* 경매 상품 ID로 세션 키 조회*/
    public String getSessionKey(Long auctionItemId) {
        return auctionSessionRepository.findByAuctionItemId(auctionItemId)
                .map(AuctionSession::getSessionKey)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경매 세션입니다: " + auctionItemId));
    }

    /* 오래된 세션 정리 7일간 보관(정리용)*/
    @Transactional
    public void cleanupOldSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(7);
        List<AuctionSession> oldSessions = auctionSessionRepository.findByStatusAndEndTimeBefore(AuctionSessionStatus.ENDED, cutoffTime);

        log.info("🧹 오래된 세션 정리 시작: {}개", oldSessions.size());

        for (AuctionSession session : oldSessions) {
            // 세션과 관련된 참여자들도 함께 삭제
            auctionParticipantRepository.deleteBySession(session);
            log.info("세션 참여자 삭제 완료: sessionId={}", session.getId());
            
            // 세션 삭제
            auctionSessionRepository.delete(session);
            log.info("오래된 세션 삭제: sessionId={}", session.getId());
        }

        log.info("✅ 오래된 세션 정리 완료: {}개 삭제됨", oldSessions.size());
    }

    /* 오래된 세션 자동 정리 (매일 새벽 2시 실행)*/
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void autoCleanupOldSessions() {
        log.info("🔄 === 오래된 세션 자동 정리 시작 ===");
        try {
            cleanupOldSessions();
            log.info("✅ === 오래된 세션 자동 정리 완료 ===");
        } catch (Exception e) {
            log.error("❌ 오래된 세션 자동 정리 중 오류 발생", e);
        }
    }

    /* 앞으로 5분 이내에 시작되는 경매가 있는지 확인하고 세션 자동 생성 (스케줄러)*/
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 * * * * *") // 1분마다 실행
    @Transactional
    public void createSessionsForScheduledAuctions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime fiveMinutesFromNow = now.plusMinutes(5);

            log.info("🔄 === 경매 세션 스케줄러 실행 시작: {} ===", now);

            // 1단계: 세션 생성
            createSessionsForUpcomingAuctions(now, fiveMinutesFromNow);

            // 2단계: 경매 시작
            startScheduledAuctions(now);

            // 3단계: 경매 종료
            endExpiredAuctions(now);

            log.info("✅ === 경매 세션 스케줄러 실행 완료 ===");

        } catch (Exception e) {
            log.error("❌ 경매 세션 스케줄러 실행 중 예상치 못한 오류 발생", e);
        }
    }

    /* 1단계: 세션이 없는 SCHEDULED 상태의 경매들의 세션 생성*/
    @Transactional
    protected void createSessionsForUpcomingAuctions(LocalDateTime now, LocalDateTime fiveMinutesFromNow) {
        try {
            // 1. 앞으로 5분 이내에 시작할 경매들
            List<AuctionItem> upcomingItems = auctionItemRepository
                .findByStartTimeBetweenAndAuctionStatus(now, fiveMinutesFromNow, AuctionStatus.SCHEDULED);

            // 2. 시작 시간이 지났지만 아직 세션이 없는 경매들
            List<AuctionItem> overdueItems = auctionItemRepository
                .findByStartTimeBeforeAndAuctionStatus(now, AuctionStatus.SCHEDULED);

            // 세션이 없는 것들만 필터링
            List<AuctionItem> itemsToCreateSession = new ArrayList<>();

            // upcomingItems에서 세션이 없는 것들 추가
            for (AuctionItem item : upcomingItems) {
                if (!auctionSessionRepository.existsByAuctionItemId(item.getId())) {
                    itemsToCreateSession.add(item);
                }
            }

            // overdueItems에서 세션이 없는 것들 추가
            for (AuctionItem item : overdueItems) {
                if (!auctionSessionRepository.existsByAuctionItemId(item.getId())) {
                    itemsToCreateSession.add(item);
                }
            }

            log.info("📋 세션 생성할 경매: {}개 (5분 이내: {}개, 지난 경매: {}개)",
                itemsToCreateSession.size(), upcomingItems.size(), overdueItems.size());

            for (AuctionItem item : itemsToCreateSession) {
                try {
                    // 시작 시간이 지난 경매는 즉시 ACTIVE로 생성
                    boolean forceActive = item.getStartTime().isBefore(now);
                    createSession(item, forceActive);
                    if (forceActive) {
                        // 경매 상품 상태도 ACTIVE로 변경
                        item.setAuctionStatus(AuctionStatus.ACTIVE);
                        auctionItemRepository.save(item);
                    }
                    log.info("✅ 세션 생성 완료: auctionItemId={}, startTime={}, forceActive={}",
                        item.getId(), item.getStartTime(), forceActive);
                } catch (Exception e) {
                    log.error("세션 생성 중 오류 발생: auctionItemId={}", item.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("세션 생성 단계에서 오류 발생", e);
        }
    }

    /* 2단계: 시작 시간이 된 WAITING 세션들을 ACTIVE로 변경*/
    @Transactional
    protected void startScheduledAuctions(LocalDateTime now) {
        try {
            List<AuctionSession> sessionsToStart = auctionSessionRepository
                .findSessionsToStart(AuctionSessionStatus.WAITING, now);

            log.info("🚀 시작할 세션: {}개", sessionsToStart.size());

            for (AuctionSession session : sessionsToStart) {
                try {
                    session.setStatus(AuctionSessionStatus.ACTIVE);
                    auctionSessionRepository.save(session);

                    // 경매 상품 상태도 ACTIVE로 변경
                    AuctionItem item = session.getAuctionItem();
                    item.setAuctionStatus(AuctionStatus.ACTIVE);
                    auctionItemRepository.save(item);

                    log.info("✅ 경매 시작: sessionId={}, auctionItemId={}", session.getId(), item.getId());
                } catch (Exception e) {
                    log.error("경매 시작 처리 중 오류 발생: sessionId={}", session.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("경매 시작 단계에서 오류 발생", e);
        }
    }

    /* 3단계: 종료 시간이 된 ACTIVE 세션들을 ENDED로 변경*/
    @Transactional
    protected void endExpiredAuctions(LocalDateTime now) {
        try {
            List<AuctionSession> sessionsToEnd = auctionSessionRepository
                .findSessionsToEnd(AuctionSessionStatus.ACTIVE, now);

            log.info("⏰ 종료할 세션: {}개", sessionsToEnd.size());

            for (AuctionSession session : sessionsToEnd) {
                try {
                    session.setStatus(AuctionSessionStatus.ENDED);
                    auctionSessionRepository.save(session);

                    // 경매 상품 상태도 ENDED로 변경
                    AuctionItem item = session.getAuctionItem();
                    item.setAuctionStatus(AuctionStatus.ENDED);
                    auctionItemRepository.save(item);

                    log.info("✅ 경매 종료: sessionId={}, auctionItemId={}", session.getId(), item.getId());

                    // 경매 낙찰 처리 (마일리지 차감, 낙찰자 확정)
                    auctionBidService.processAuctionEnd(item.getId());

                    // WebSocket으로 경매 종료 메시지 전송
                    try {
                        String sessionKey = getSessionKey(item.getId());
                        messagingTemplate.convertAndSend("/topic/auction/" + sessionKey,
                                createEndNotification(item.getId()));

                        // 낙찰자에게 개별 알림
                        Optional<Member> winnerOpt = auctionBidService.getCurrentHighestBidder(item);
                        if (winnerOpt.isPresent()) {
                            messagingTemplate.convertAndSend("/queue/auction/" + winnerOpt.get().getMemberId(),
                                    createWinnerNotification(item.getId(), winnerOpt.get()));
                        }
                    } catch (Exception e) {
                        log.error("경매 종료 WebSocket 메시지 전송 실패: auctionItemId={}", item.getId(), e);
                    }
                } catch (Exception e) {
                    log.error("경매 종료 처리 중 오류 발생: sessionId={}", session.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("경매 종료 단계에서 오류 발생", e);
        }
    }

    /* 경매 종료 알림 생성*/
    private Object createEndNotification(Long auctionItemId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "AUCTION_END");
        notification.put("message", "경매가 종료되었습니다.");
        notification.put("auctionItemId", auctionItemId);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }

    /* 낙찰자 알림 생성*/
    private Object createWinnerNotification(Long auctionItemId, Member winner) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "AUCTION_WIN");
        notification.put("message", "축하합니다! 경매에서 낙찰되었습니다.");
        notification.put("auctionItemId", auctionItemId);
        notification.put("winnerId", winner.getMemberId());
        notification.put("winnerNickname", winner.getMember_NickName());
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }


}
