package com.petory.controller.shop;

import com.petory.dto.shop.AuctionParticipantDto;
import com.petory.entity.Member;
import com.petory.entity.shop.AuctionParticipant;
import com.petory.entity.shop.AuctionSession;
import com.petory.service.shop.AuctionParticipantService;
import com.petory.service.shop.AuctionSessionService;
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
@RequestMapping("/api/auction/participants")
@RequiredArgsConstructor
public class AuctionParticipantController { //참여자관리

    private final AuctionParticipantService auctionParticipantService;
    private final AuctionSessionService auctionSessionService;


     /* 참여자 입장 */
    @PostMapping("/{sessionId}/join")
    public ResponseEntity<AuctionParticipantDto> joinSession(
            @PathVariable Long sessionId,
            @RequestParam String connectionId,
            @AuthenticationPrincipal Member member) {

        log.info("참여자 입장 요청: sessionId={}, memberId={}, connectionId={}",
                sessionId, member.getMemberId(), connectionId);

        try {
            // 세션 존재 확인
            Optional<AuctionSession> sessionOpt = auctionSessionService.getSessionById(sessionId);
            if (sessionOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // 참여자 입장
            AuctionParticipant participant = auctionParticipantService.joinSession(sessionId, member, connectionId);
            AuctionParticipantDto participantDto = auctionParticipantService.convertToDto(participant);

            log.info("참여자 입장 완료: participantId={}", participant.getId());
            return ResponseEntity.ok(participantDto);

        } catch (IllegalArgumentException e) {
            log.warn("참여자 입장 실패 (존재하지 않는 세션): sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("참여자 입장 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 참여자 퇴장*/
    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<Void> leaveSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Member member) {

        log.info("참여자 퇴장 요청: sessionId={}, memberId={}", sessionId, member.getMemberId());

        try {
            auctionParticipantService.leaveSession(sessionId, member);
            log.info("참여자 퇴장 완료: memberId={}", member.getMemberId());
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("참여자 퇴장 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }



}
