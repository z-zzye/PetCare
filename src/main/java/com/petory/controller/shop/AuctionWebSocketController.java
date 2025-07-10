package com.petory.controller.shop;

import com.petory.dto.shop.AuctionBidDto;
import com.petory.dto.shop.AuctionParticipantDto;
import com.petory.entity.Member;
import com.petory.service.shop.AuctionBidService;
import com.petory.service.shop.AuctionParticipantService;
import com.petory.service.shop.AuctionSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import com.petory.config.JwtTokenProvider;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.security.Principal;
import com.petory.repository.MemberRepository;

@Slf4j
@Controller
@RequiredArgsConstructor
public class AuctionWebSocketController { //실시간 통신

    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionBidService auctionBidService;
    private final AuctionParticipantService auctionParticipantService;
    private final AuctionSessionService auctionSessionService;
    private final MemberRepository memberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;


    /* 경매 입찰 처리 */
    @MessageMapping("/auction.bid")
    public void handleBid(@Payload AuctionBidDto bidDto, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        if (email == null) {
            log.error("인증 정보 없음: 입찰 불가");
            return;
        }
        Member member = memberRepository.findByMember_Email(email)
            .orElseThrow(() -> new IllegalArgumentException("사용자 정보 없음: " + email));
        log.info("경매 입찰 요청: auctionItemId={}, memberId={}, bidAmount={}",
                bidDto.getAuctionItemId(), member.getMemberId(), bidDto.getBidAmount());
        try {
            auctionBidService.placeBid(bidDto.getAuctionItemId(), member, bidDto.getBidAmount());
            String sessionKey = getSessionKey(bidDto.getAuctionItemId());
            messagingTemplate.convertAndSend("/topic/auction/" + sessionKey, bidDto);
            messagingTemplate.convertAndSend("/queue/auction/" + member.getMemberId(),
                    createBidNotification(bidDto, "입찰이 성공적으로 처리되었습니다."));
        } catch (Exception e) {
            log.error("입찰 처리 실패: {}", e.getMessage());
            messagingTemplate.convertAndSend("/queue/auction/" + member.getMemberId(),
                    createErrorNotification("입찰 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }


    /* 경매 세션 참여*/
    @MessageMapping("/auction.join")
    public void handleJoin(@Payload Long auctionItemId, Message<?> message) {
        log.info("[WebSocket] ===== handleJoin 시작 =====");
        log.info("[WebSocket] auctionItemId: {}", auctionItemId);
        log.info("[WebSocket] message: {}", message);

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        log.info("[WebSocket] accessor: {}", accessor);

        // 세션에서 토큰을 직접 꺼내서 인증 처리
        String token = (String) accessor.getSessionAttributes().get("token");
        log.info("[WebSocket] 세션에서 토큰: {}", token);

        // WebSocket 세션 ID 추출
        String connectionId = accessor.getSessionId();
        log.info("[WebSocket] connectionId(WebSocket 세션 ID): {}", connectionId);

        Authentication auth = (Authentication) accessor.getUser();
        log.info("[WebSocket] handleJoin called! auctionItemId={}, auth={}", auctionItemId, auth);
        log.info("[WebSocket] accessor.getUser(): {}", accessor.getUser());
        log.info("[WebSocket] SecurityContextHolder.getContext().getAuthentication(): {}", SecurityContextHolder.getContext().getAuthentication());
        log.info("[WebSocket] accessor.getSessionAttributes(): {}", accessor.getSessionAttributes());

        // 토큰이 있으면 직접 인증 처리
        if (auth == null && token != null) {
            try {
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }
                String email = jwtTokenProvider.getEmail(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                log.info("[WebSocket] 직접 인증 생성: {}", auth);
            } catch (Exception e) {
                log.error("[WebSocket] 토큰 인증 실패: {}", e.getMessage());
                return;
            }
        }

        if (auth == null) {
            log.error("[WebSocket] 인증 정보 없음: 세션 참여 불가 (accessor.getUser() is null)");
            return;
        }
        String email = auth.getName();
        Member member = null;
        try {
            member = memberRepository.findByMember_Email(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보 없음: " + email));
        } catch (Exception e) {
            log.error("[WebSocket] Member 조회 실패: {}", e.getMessage());
            return;
        }
        log.info("[WebSocket] 경매 세션 참여 요청: auctionItemId={}, memberId={}", auctionItemId, member.getMemberId());
        try {
            // connectionId를 서비스로 전달
            AuctionParticipantDto participant = auctionParticipantService.joinSessionByAuctionItem(auctionItemId, member, connectionId);
            String sessionKey = getSessionKey(auctionItemId);
            messagingTemplate.convertAndSend("/topic/auction/" + sessionKey,
                    createParticipantNotification(participant, "새로운 참여자가 입장했습니다."));
            messagingTemplate.convertAndSend("/queue/auction/" + member.getMemberId(),
                    createJoinNotification(participant));
        } catch (Exception e) {
            log.error("세션 참여 실패: {}", e.getMessage());
            messagingTemplate.convertAndSend("/queue/auction/" + member.getMemberId(),
                    createErrorNotification("세션 참여 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }


     /* 경매 세션 퇴장*/
    @MessageMapping("/auction.leave")
    public void handleLeave(@Payload Long auctionItemId, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        if (email == null) {
            log.error("인증 정보 없음: 세션 퇴장 불가");
            return;
        }
        Member member = memberRepository.findByMember_Email(email)
            .orElseThrow(() -> new IllegalArgumentException("사용자 정보 없음: " + email));
        log.info("경매 세션 퇴장 요청: auctionItemId={}, memberId={}", auctionItemId, member.getMemberId());
        try {
            auctionParticipantService.leaveSession(auctionItemId, member);
            String sessionKey = getSessionKey(auctionItemId);
            messagingTemplate.convertAndSend("/topic/auction/" + sessionKey,
                    createLeaveNotification(member.getMemberId(), member.getMember_NickName()));
        } catch (Exception e) {
            log.error("세션 퇴장 실패: {}", e.getMessage());
        }
    }


     /* 경매 상태 업데이트 (관리자용)*/
    @MessageMapping("/auction.status")
    public void handleStatusUpdate(@Payload String statusUpdate, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        if (email == null) {
            log.error("인증 정보 없음: 상태 업데이트 불가");
            return;
        }
        Member member = memberRepository.findByMember_Email(email)
            .orElseThrow(() -> new IllegalArgumentException("사용자 정보 없음: " + email));
        log.info("경매 상태 업데이트: memberId={}, status={}", member.getMemberId(), statusUpdate);
        // TODO: 관리자 권한 확인
        // TODO: 경매 상태 업데이트 로직
        messagingTemplate.convertAndSend("/topic/auction/status", statusUpdate);
    }


     /* 경매 종료 알림 */
    @MessageMapping("/auction.end")
    public void handleAuctionEnd(@Payload Long auctionItemId, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        if (email == null) {
            log.error("인증 정보 없음: 경매 종료 불가");
            return;
        }
        Member member = memberRepository.findByMember_Email(email)
            .orElseThrow(() -> new IllegalArgumentException("사용자 정보 없음: " + email));
        log.info("경매 종료 처리: auctionItemId={}, memberId={}", auctionItemId, member.getMemberId());
        try {
            // 경매 종료 처리
            // TODO: 경매 종료 로직 구현
            String sessionKey = getSessionKey(auctionItemId);
            messagingTemplate.convertAndSend("/topic/auction/" + sessionKey,
                    createEndNotification(auctionItemId));
        } catch (Exception e) {
            log.error("경매 종료 처리 실패: {}", e.getMessage());
        }
    }


     /* 세션 키 조회 헬퍼 메서드*/
    private String getSessionKey(Long auctionItemId) {
        try {
            return auctionSessionService.getSessionKey(auctionItemId);
        } catch (Exception e) {
            log.warn("세션 키 조회 실패: auctionItemId={}, error={}", auctionItemId, e.getMessage());
            return "session-" + auctionItemId; // 임시 키
        }
    }


     /* 입찰 알림 생성*/
    private Object createBidNotification(AuctionBidDto bidDto, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "BID_SUCCESS");
        notification.put("message", message);
        notification.put("bid", bidDto);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }


     /* 참여자 알림 생성*/
    private Object createParticipantNotification(AuctionParticipantDto participant, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "PARTICIPANT_JOIN");
        notification.put("message", message);
        notification.put("participantInfo", participant);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }


     /* 참여 성공 알림 생성*/
    private Object createJoinNotification(AuctionParticipantDto participant) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "JOIN_SUCCESS");
        notification.put("message", "경매 세션에 성공적으로 참여했습니다.");
        notification.put("participantInfo", participant);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }


     /* 퇴장 알림 생성*/
    private Object createLeaveNotification(Long memberId, String nickname) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "PARTICIPANT_LEAVE");
        notification.put("message", nickname + "님이 퇴장했습니다.");
        notification.put("leftMemberId", memberId);
        notification.put("leftMemberNickname", nickname);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
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


     /* 에러 알림 생성*/
    private Object createErrorNotification(String errorMessage) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "ERROR");
        notification.put("message", errorMessage);
        notification.put("timestamp", LocalDateTime.now());
        return notification;
    }
}
