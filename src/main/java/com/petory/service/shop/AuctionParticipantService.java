package com.petory.service.shop;

import com.petory.dto.shop.AuctionParticipantDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionItem;
import com.petory.entity.shop.AuctionParticipant;
import com.petory.entity.shop.AuctionSession;
import com.petory.repository.shop.AuctionItemRepository;
import com.petory.repository.shop.AuctionParticipantRepository;
import com.petory.repository.shop.AuctionBidRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AuctionParticipantService {

    private final AuctionParticipantRepository auctionParticipantRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final AuctionSessionService auctionSessionService;

    @Autowired
    public AuctionParticipantService(
            AuctionParticipantRepository auctionParticipantRepository,
            AuctionItemRepository auctionItemRepository,
            AuctionBidRepository auctionBidRepository,
            @Lazy AuctionSessionService auctionSessionService) {
        this.auctionParticipantRepository = auctionParticipantRepository;
        this.auctionItemRepository = auctionItemRepository;
        this.auctionBidRepository = auctionBidRepository;
        this.auctionSessionService = auctionSessionService;
    }

    /**
     * 참여자 입장
     */
    @Transactional
    public AuctionParticipant joinSession(Long sessionId, Member member, String connectionId) {
        log.info("참여자 입장: sessionId={}, memberId={}, connectionId={}", sessionId, member.getMemberId(), connectionId);
        
        // 세션 존재 확인
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 세션입니다: " + sessionId);
        }
        
        AuctionSession session = sessionOpt.get();
        
        // 이미 참여 중인지 확인
        Optional<AuctionParticipant> existingParticipant = auctionParticipantRepository.findBySessionAndMember(session, member);
        if (existingParticipant.isPresent()) {
            AuctionParticipant participant = existingParticipant.get();
            // 연결 ID 업데이트 (새로운 탭에서 접속한 경우)
            participant.setConnectionId(connectionId);
            participant.setIsActive(true);
            participant.setLastActivity(LocalDateTime.now());
            log.info("기존 참여자 재접속: participantId={}", participant.getId());
            return auctionParticipantRepository.save(participant);
        }
        
        // 새로운 참여자 생성
        AuctionParticipant participant = AuctionParticipant.builder()
                .session(session)
                .member(member)
                .connectionId(connectionId)
                .joinedAt(LocalDateTime.now())
                .lastActivity(LocalDateTime.now())
                .isActive(true)
                .build();
        
        AuctionParticipant savedParticipant = auctionParticipantRepository.save(participant);
        log.info("새로운 참여자 입장: participantId={}", savedParticipant.getId());
        
        // 참여자 수 업데이트
        long activeCount = auctionParticipantRepository.countBySessionAndIsActiveTrue(session);
        auctionSessionService.updateParticipantCount(sessionId, (int) activeCount);
        
        return savedParticipant;
    }

    /**
     * 참여자 퇴장
     */
    @Transactional
    public void leaveSession(Long sessionId, Member member) {
        log.info("참여자 퇴장: sessionId={}, memberId={}", sessionId, member.getMemberId());
        
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) return;
        
        AuctionSession session = sessionOpt.get();
        Optional<AuctionParticipant> participantOpt = auctionParticipantRepository.findBySessionAndMember(session, member);
        if (participantOpt.isPresent()) {
            AuctionParticipant participant = participantOpt.get();
            participant.setIsActive(false);
            participant.setLastActivity(LocalDateTime.now());
            auctionParticipantRepository.save(participant);
            log.info("참여자 퇴장 완료: participantId={}", participant.getId());
            
            // 참여자 수 업데이트
            long activeCount = auctionParticipantRepository.countBySessionAndIsActiveTrue(session);
            auctionSessionService.updateParticipantCount(sessionId, (int) activeCount);
        }
    }

    /**
     * 입찰 정보 업데이트 (실시간 계산으로 변경)
     */
    @Transactional
    public void updateBidInfo(Long sessionId, Member member, Integer bidAmount) {
        log.info("입찰 정보 업데이트: sessionId={}, memberId={}, bidAmount={}", sessionId, member.getMemberId(), bidAmount);
        
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) return;
        
        AuctionSession session = sessionOpt.get();
        auctionParticipantRepository.findBySessionAndMember(session, member)
                .ifPresent(participant -> {
                    participant.setLastActivity(LocalDateTime.now());
                    auctionParticipantRepository.save(participant);
                    
                    log.info("참여자 활동 시간 업데이트 완료: participantId={}", participant.getId());
                });
    }

    /**
     * 세션의 활성 참여자 조회
     */
    public List<AuctionParticipant> getActiveParticipants(Long sessionId) {
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) return List.of();
        
        return auctionParticipantRepository.findBySessionAndIsActiveTrue(sessionOpt.get());
    }

    /**
     * 활성 참여자 수 조회
     */
    public long getActiveParticipantCount(Long sessionId) {
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
        if (sessionOpt.isEmpty()) return 0;
        
        return auctionParticipantRepository.countBySessionAndIsActiveTrue(sessionOpt.get());
    }

    /**
     * 연결 ID로 참여자 조회
     */
    public Optional<AuctionParticipant> getParticipantByConnectionId(String connectionId) {
        return auctionParticipantRepository.findByConnectionId(connectionId);
    }

    /**
     * 경매 상품 ID로 세션 참여 (WebSocket용)
     */
    @Transactional
    public AuctionParticipantDto joinSessionByAuctionItem(Long auctionItemId, Member member, String connectionId) {
        log.info("경매 상품으로 세션 참여: auctionItemId={}, memberId={}", auctionItemId, member.getMemberId());
        
        // 경매 상품 존재 확인
        AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경매입니다: " + auctionItemId));
        
        // 경매 상품으로 세션 조회
        Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionByAuctionItem(auctionItem);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("경매 세션이 생성되지 않았습니다. 관리자에게 문의해주세요: " + auctionItemId);
        }
        
        AuctionSession session = sessionOpt.get();
        AuctionParticipant participant = joinSession(session.getId(), member, connectionId);
        return convertToDto(participant);
    }

    /**
     * 참여자 정보를 DTO로 변환 (실시간 계산)
     */
    public AuctionParticipantDto convertToDto(AuctionParticipant participant) {
        if (participant == null) return null;
        
        // 실시간으로 입찰 정보 계산
        Long totalBids = auctionBidRepository.countByAuctionItemAndMember(
            participant.getSession().getAuctionItem(), participant.getMember());
        Integer highestBidAmount = auctionBidRepository.findMaxBidAmountByAuctionItemAndMember(
            participant.getSession().getAuctionItem(), participant.getMember()).orElse(0);
        
        return AuctionParticipantDto.builder()
                .participantId(participant.getId())
                .sessionId(participant.getSession().getId())
                .sessionKey(participant.getSession().getSessionKey())
                .memberId(participant.getMember().getMemberId())
                .memberNickname(participant.getMember().getMember_NickName())
                .memberProfileImage(participant.getMember().getMember_ProfileImg())
                .connectionId(participant.getConnectionId())
                .joinedAt(participant.getJoinedAt())
                .lastActivity(participant.getLastActivity())
                .isActive(participant.getIsActive())
                .isOnline(participant.getIsActive())
                .totalBids(totalBids.intValue())
                .highestBidAmount(highestBidAmount)
                .currentStatus(totalBids > 0 ? "입찰 중" : "관찰 중")
                .lastBidTime(participant.getLastActivity())
                .lastBidAmount(highestBidAmount)
                .totalParticipants((int) getActiveParticipantCount(participant.getSession().getId()))
                .build();
    }
} 