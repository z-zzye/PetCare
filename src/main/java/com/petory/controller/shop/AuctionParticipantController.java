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


     /* 세션의 활성 참여자 목록 조회*/
    @GetMapping("/{sessionId}/active")
    public ResponseEntity<List<AuctionParticipantDto>> getActiveParticipants(@PathVariable Long sessionId) {
        log.info("활성 참여자 목록 조회 요청: sessionId={}", sessionId);

        try {
            List<AuctionParticipant> participants = auctionParticipantService.getActiveParticipants(sessionId);
            List<AuctionParticipantDto> participantDtos = participants.stream()
                    .map(auctionParticipantService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(participantDtos);

        } catch (Exception e) {
            log.error("활성 참여자 목록 조회 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 활성 참여자 수 조회 */
    @GetMapping("/{sessionId}/count")
    public ResponseEntity<Long> getActiveParticipantCount(@PathVariable Long sessionId) {
        log.info("활성 참여자 수 조회 요청: sessionId={}", sessionId);

        try {
            long count = auctionParticipantService.getActiveParticipantCount(sessionId);
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            log.error("활성 참여자 수 조회 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 연결 ID로 참여자 조회*/
    @GetMapping("/connection/{connectionId}")
    public ResponseEntity<AuctionParticipantDto> getParticipantByConnectionId(@PathVariable String connectionId) {
        log.info("연결 ID로 참여자 조회 요청: connectionId={}", connectionId);

        try {
            Optional<AuctionParticipant> participantOpt = auctionParticipantService.getParticipantByConnectionId(connectionId);
            if (participantOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AuctionParticipantDto participantDto = auctionParticipantService.convertToDto(participantOpt.get());
            return ResponseEntity.ok(participantDto);

        } catch (Exception e) {
            log.error("연결 ID로 참여자 조회 실패: connectionId={}, error={}", connectionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }




     /* 참여자 존재 여부 확인*/
    @GetMapping("/{sessionId}/exists")
    public ResponseEntity<Boolean> isParticipant(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Member member) {

        log.info("참여자 존재 여부 확인 요청: sessionId={}, memberId={}", sessionId, member.getMemberId());

        try {
            // TODO: AuctionParticipantService에 메서드 추가 필요
            // boolean exists = auctionParticipantService.isParticipant(sessionId, member.getMemberId());
            boolean exists = true; // 임시로 true 반환
            return ResponseEntity.ok(exists);

        } catch (Exception e) {
            log.error("참여자 존재 여부 확인 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 활성 참여자 존재 여부 확인*/
    @GetMapping("/{sessionId}/active-exists")
    public ResponseEntity<Boolean> isActiveParticipant(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Member member) {

        log.info("활성 참여자 존재 여부 확인 요청: sessionId={}, memberId={}", sessionId, member.getMemberId());

        try {
            // TODO: AuctionParticipantService에 메서드 추가 필요
            // boolean isActive = auctionParticipantService.isActiveParticipant(sessionId, member.getMemberId());
            boolean isActive = true; // 임시로 true 반환
            return ResponseEntity.ok(isActive);

        } catch (Exception e) {
            log.error("활성 참여자 존재 여부 확인 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


     /* 참여자 활동 업데이트 (WebSocket 연결 유지용)*/
    @PostMapping("/{sessionId}/activity")
    public ResponseEntity<Void> updateActivity(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Member member) {

        log.debug("참여자 활동 업데이트 요청: sessionId={}, memberId={}", sessionId, member.getMemberId());

        try {
            // TODO: AuctionParticipantService에 메서드 추가 필요
            // auctionParticipantService.updateActivity(sessionId, member.getMemberId());
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("참여자 활동 업데이트 실패: sessionId={}, error={}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
