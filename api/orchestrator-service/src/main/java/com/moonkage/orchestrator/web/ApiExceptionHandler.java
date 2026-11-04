package com.moonkage.orchestrator.web;

import com.moonkage.orchestrator.application.NotificationNotFoundException;
import com.moonkage.orchestrator.contract.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Central error boundary of orchestrator-service.
 *
 * <p>Every answer carries the same envelope (BE-03), so the web reads a failure the same way it reads a success.
 */
@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            NotificationNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(
                        HttpStatus.NOT_FOUND,
                        "NOTIFICATION_NOT_FOUND",
                        "Không tìm thấy thông báo",
                        request.getRequestURI()));
    }

    /** X-Account-Id is set by the gateway; missing means the call did not come through it with a token. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(
                        HttpStatus.UNAUTHORIZED,
                        "UNAUTHENTICATED",
                        "Thiếu thông tin đăng nhập",
                        request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalid(IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        HttpStatus.BAD_REQUEST, "INVALID_REQUEST", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnhandled(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "INTERNAL_ERROR",
                        "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
                        request.getRequestURI()));
    }
}
