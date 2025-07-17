package com.petory.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.petory.dto.autoReservation.ReservationDetailDto;
import com.petory.entity.Member;
import com.petory.repository.MemberRepository;
import com.petory.service.ReservationService; // ✅ AutoReservationService가 아닌 일반 ReservationService를 사용

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

  /**
   * [신규] 접종 완료 처리 및 다음 예약을 생성하는 API
   * @param reservationId 완료 처리할 예약의 ID
   * @param principal     요청을 보낸 사용자의 정보
   * @return 성공 메시지
   */
  @PostMapping("/{reservationId}/complete")
  public ResponseEntity<?> completeAndScheduleNext(
    @PathVariable("reservationId") Long reservationId,
    Principal principal) {

    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      // 서비스 로직 호출 (이메일을 넘겨서 권한 확인)
      reservationService.completeAndScheduleNext(reservationId, principal.getName());
      return ResponseEntity.ok(Map.of("message", "접종 완료 처리되었으며, 다음 예약이 자동으로 생성되었습니다."));

    } catch (IllegalArgumentException e) { // 잘못된 ID 또는 상태
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (SecurityException e) { // 권한 없는 사용자의 접근
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
    } catch (IllegalStateException e) { // 결제 수단 관련 예외
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) { // 그 외 모든 예외
      log.error("접종 완료 처리 중 오류 발생: reservationId={}", reservationId, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "서버 내부 오류가 발생했습니다."));
    }
  }

  /**
   * [사용자용] 자신의 예약을 직접 취소하는 API
   */
  @DeleteMapping("/{reservationId}")
  @PreAuthorize("hasAnyAuthority('USER', 'CREATOR')")
  public ResponseEntity<?> cancelReservationByUser(
    @PathVariable("reservationId") Long reservationId,
    Principal principal) {

    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

      try {
        reservationService.cancelByUser(reservationId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "예약이 정상적으로 취소되었습니다."));
      } catch (IllegalArgumentException e) { // 잘못된 ID 또는 상태
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
      } catch (SecurityException e) { // 권한 없는 사용자의 접근
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
      } catch (Exception e) {
        log.error("예약 취소 처리 중 오류 발생: reservationId={}", reservationId, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "서버 내부 오류가 발생했습니다."));
      }

  }

  /**
   * [병원/관리자용] 예약을 취소 처리하는 API
   */
  @PostMapping("/{reservationId}/cancel-by-clinic")
  @PreAuthorize("hasAnyAuthority('VET', 'ADMIN')")
  public ResponseEntity<?> cancelByClinic(
    @PathVariable("reservationId") Long reservationId,
    Principal principal) {

    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

      try {
        reservationService.cancelByClinic(reservationId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "해당 예약이 관리자에 의해 정상적으로 취소되었습니다."));
      } catch (IllegalArgumentException e) { // 잘못된 ID 또는 상태
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
      } catch (SecurityException e) { // 권한 없는 사용자의 접근
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
      } catch (Exception e) {
        log.error("예약 취소 처리 중 오류 발생: reservationId={}", reservationId, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "서버 내부 오류가 발생했습니다."));
      }

  }

  /**
   * [관리자/병원용] 예약 상태를 변경하는 API
   */
  @PutMapping("/{reservationId}/status")
  @PreAuthorize("hasAnyAuthority('VET', 'ADMIN')")
  public ResponseEntity<?> updateStatusByAdmin(
    @PathVariable("reservationId") Long reservationId,
    @RequestBody Map<String, String> request,
    Principal principal) {

    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      String newStatus = request.get("status");
      if (newStatus == null || newStatus.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("error", "상태값이 필요합니다."));
      }
      
      reservationService.updateReservationStatusByAdmin(reservationId, newStatus);
      return ResponseEntity.ok(Map.of("message", "예약 상태가 성공적으로 변경되었습니다."));
      
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
      log.error("예약 상태 변경 중 오류 발생: reservationId={}", reservationId, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "서버 내부 오류가 발생했습니다."));
    }
  }

  /**
   * [관리자/병원용] 모든 예약 목록을 조회하는 API
   */
  @GetMapping("/admin/list")
  @PreAuthorize("hasAnyAuthority('VET', 'ADMIN')")
  public ResponseEntity<?> getAllReservations(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

    try {
      List<ReservationDetailDto> reservations = reservationService.getAllAutoVaxReservations();
      return ResponseEntity.ok(reservations);
    } catch (Exception e) {
      log.error("관리자용 예약 목록 조회 중 오류 발생", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "서버 내부 오류가 발생했습니다."));
    }
  }

  // TODO: 추후 이곳에 '예약 상세 조회' 등의 API를 추가할 수 있습니다.
}
