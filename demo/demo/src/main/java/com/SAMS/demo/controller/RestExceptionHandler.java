package com.SAMS.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class RestExceptionHandler {

  @ExceptionHandler(TrialExpiredException.class)
  @ResponseStatus(HttpStatus.FORBIDDEN)
  public Map<String, Object> handleTrialExpired(TrialExpiredException ex) {
    return Map.of(
        "error", "TRIAL_EXPIRED",
        "message", ex.getMessage()
    );
  }

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, Object> handleBadRequest(IllegalArgumentException ex) {
    return Map.of(
        "error", "BAD_REQUEST",
        "message", ex.getMessage()
    );
  }

  @ExceptionHandler(SecurityException.class)
  @ResponseStatus(HttpStatus.FORBIDDEN)
  public Map<String, Object> handleForbidden(SecurityException ex) {
    return Map.of(
        "error", "FORBIDDEN",
        "message", ex.getMessage()
    );
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String, Object> handleGeneric(Exception ex) {
    return Map.of(
        "error", "SERVER_ERROR",
        "message", "Server error"
    );
  }

  public static class TrialExpiredException extends RuntimeException {
    public TrialExpiredException(String msg) { super(msg); }
  }
}
