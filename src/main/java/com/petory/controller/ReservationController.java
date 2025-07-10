package com.petory.controller;

import com.petory.dto.autoReservation.ReservationDetailDto;
import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import com.petory.service.ReservationService; // ✅ AutoReservationService가 아닌 일반 ReservationService를 사용
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations") // ✅ 베이스 경로를 /api/reservations로 설정
@RequiredArgsConstructor
@Slf4j
public class ReservationController {

  // ✅ 일반 예약 관련 서비스와 레포지토리를 주입받습니다.
  private final ReservationService reservationService;
  private final MemberRepository memberRepository;

  /**
   * 현재 로그인한 사용자의 모든 예약 목록을 반환합니다.
   * @param principal Spring Security가 제공하는 현재 사용자 정보 객체
   * @return List<ReservationDetailDto>
   */
  @GetMapping("/my-list")
  public ResponseEntity<?> getMyReservations(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      String userEmail = principal.getName();
      Member member = memberRepository.findByMember_Email(userEmail)
        .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));

      List<ReservationDetailDto> reservations = reservationService.findMyReservations(member.getMember_Id());
      return ResponseEntity.ok(reservations);

    } catch (Exception e) {
      log.error("내 예약 목록 조회 중 오류 발생", e);
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  // TODO: 추후 이곳에 '예약 상세 조회', '예약 취소' 등의 API를 추가할 수 있습니다.
}
