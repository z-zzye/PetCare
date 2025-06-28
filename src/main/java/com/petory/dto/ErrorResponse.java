package com.petory.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
@Builder
public class ErrorResponse {
  private final int status;
  private final String error;
  private final String code;
  private final String message;

  public static ResponseEntity<ErrorResponse> toResponseEntity(HttpStatus httpStatus, String message) {
    return ResponseEntity
      .status(httpStatus)
      .body(ErrorResponse.builder()
        .status(httpStatus.value())
        .error(httpStatus.name())
        .code(httpStatus.name())
        .message(message)
        .build()
      );
  }
}
