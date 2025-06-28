package com.petory.exception;

import com.petory.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * @Valid 어노테이션을 사용한 DTO의 유효성 검사에 실패했을 때 처리합니다.
   * 예: @NotBlank 필드가 비어있는 경우
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    // BindingResult에서 모든 필드 에러를 가져와 Map에 담습니다.
    ex.getBindingResult().getAllErrors().forEach((error) -> {
      String fieldName = ((FieldError) error).getField();
      String errorMessage = error.getDefaultMessage();
      errors.put(fieldName, errorMessage);
    });
    // 400 Bad Request 상태 코드와 함께, 필드별 에러 메시지를 담은 JSON을 반환합니다.
    return ResponseEntity.badRequest().body(errors);
  }

  /**
   * 서비스 계층에서 비즈니스 로직 예외가 발생했을 때 처리합니다.
   * 예: "해당 사용자를 찾을 수 없습니다." (IllegalArgumentException)
   * 예: "게시글을 수정할 권한이 없습니다." (IllegalStateException)
   */
  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  public ResponseEntity<ErrorResponse> handleBusinessException(RuntimeException e) {
    // 클라이언트의 잘못된 요청으로 간주하고 400 Bad Request를 반환합니다.
    return ErrorResponse.toResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  /**
   * 그 외에 처리하지 못한 모든 예외를 처리합니다.
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleAllUncaughtException(Exception e) {
    // 예측하지 못한 서버 내부의 오류이므로 500 Internal Server Error를 반환합니다.
    // 실제 운영 시에는 e.getMessage() 대신 "서버 내부 오류가 발생했습니다." 와 같은 일반적인 메시지를 사용하는 것이 좋습니다.
    return ErrorResponse.toResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");
  }
}
