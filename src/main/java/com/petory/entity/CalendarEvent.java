package com.petory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

// CalendarEvent.java
@Entity
@Table(name = "calendar_event")
@Getter
@Setter
@NoArgsConstructor
public class CalendarEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "calendar_id")
  private Long calendarId;

  @Column(name = "member_id", nullable = false)
  private Long memberId;

  @Column(name = "calendar_content", nullable = false)
  private String calendarContent;

  @Column(name = "calendar_event_date", nullable = false)
  private LocalDate calendarEventDate;
}
