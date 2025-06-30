package com.petory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

// CalendarEventDTO.java
@Getter
@Setter
@NoArgsConstructor
public class CalendarEventDto {

  @JsonProperty("calendar_id")
  private Long calendar_id;

  @JsonProperty("member_id")
  private Long member_id;

  @JsonProperty("calendar_content")
  private String calendar_content;

  @JsonProperty("calendar_event_date")
  private LocalDate calendar_event_date;
}
