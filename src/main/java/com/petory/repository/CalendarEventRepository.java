package com.petory.repository;

import com.petory.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// CalendarEventRepository.java
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

  List<CalendarEvent> findByMemberId(Long memberId);
}
