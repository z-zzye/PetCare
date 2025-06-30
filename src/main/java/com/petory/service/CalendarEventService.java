package com.petory.service;

import com.petory.dto.CalendarEventDto;
import com.petory.entity.CalendarEvent;
import com.petory.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

// CalendarEventService.java
@Service
@RequiredArgsConstructor
public class CalendarEventService {

  private final CalendarEventRepository calendarEventRepository;

  public List<CalendarEventDto> getEventsByMemberId(Long memberId) {
    return calendarEventRepository.findByMemberId(memberId)
      .stream()
      .map(event -> {
        CalendarEventDto dto = new CalendarEventDto();
        dto.setCalendar_id(event.getCalendarId());
        dto.setMember_id(event.getMemberId());
        dto.setCalendar_content(event.getCalendarContent());
        dto.setCalendar_event_date(event.getCalendarEventDate());
        return dto;
      })
      .collect(Collectors.toList());
  }

  public CalendarEventDto createEvent(CalendarEventDto dto) {
    CalendarEvent event = new CalendarEvent();
    event.setMemberId(dto.getMember_id());
    event.setCalendarContent(dto.getCalendar_content());
    event.setCalendarEventDate(dto.getCalendar_event_date());
    CalendarEvent saved = calendarEventRepository.save(event);

    dto.setCalendar_id(saved.getCalendarId());
    return dto;
  }

  public void deleteEvent(Long calendarId) {
    calendarEventRepository.deleteById(calendarId);
  }
}
