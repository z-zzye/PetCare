package com.petory.controller;

import com.petory.config.CustomUserDetails;
import com.petory.dto.CalendarEventDto;
import com.petory.service.CalendarEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// CalendarEventController.java
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

  private final CalendarEventService calendarEventService;

  @GetMapping
  public ResponseEntity<List<CalendarEventDto>> getMyEvents(@AuthenticationPrincipal Object principal) {
    System.out.println("[DEBUG] principal class: " + (principal != null ? principal.getClass() : "null"));
    System.out.println("[DEBUG] principal: " + principal);
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    if (principal instanceof com.petory.config.CustomUserDetails userDetails) {
      if (userDetails.getMember() == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      }
      Long memberId = userDetails.getMember().getMember_Id();
      return ResponseEntity.ok(calendarEventService.getEventsByMemberId(memberId));
    } else {
      // principal이 CustomUserDetails가 아니면 인증 실패로 처리
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
  }

  @PostMapping
  public ResponseEntity<CalendarEventDto> addEvent(@AuthenticationPrincipal CustomUserDetails user,
                                                   @RequestBody CalendarEventDto dto) {
    if (user == null || user.getMember() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    dto.setMember_id(user.getMember().getMember_Id()); // 로그인된 사용자 ID 자동 설정
    return ResponseEntity.ok(calendarEventService.createEvent(dto));
  }

  @DeleteMapping("/{calendarId}")
  public ResponseEntity<Void> deleteEvent(@PathVariable Long calendarId) {
    calendarEventService.deleteEvent(calendarId);
    return ResponseEntity.noContent().build();
  }
}
