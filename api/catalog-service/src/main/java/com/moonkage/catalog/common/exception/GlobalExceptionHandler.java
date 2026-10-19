package com.moonkage.catalog.common.exception;

import com.moonkage.storage.InvalidFileException;
import com.moonkage.storage.StorageErrorCode;
import com.moonkage.storage.StorageUnavailableException;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Same error body as identity-service. */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    /** Holds storage-messages (spring.messages.basename). */
    private final MessageSource messageSource;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không hợp lệ", request);
    }

    /** X-User-* headers are set by the gateway; missing means the call did not come through it with a token. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Thiếu thông tin đăng nhập", request);
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustom(CustomException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFile(InvalidFileException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, localize(ex.getErrorCode(), ex.getMessageArgs()), request);
    }

    @ExceptionHandler(StorageUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleStorage(StorageUnavailableException ex, HttpServletRequest request) {
        log.error("MinIO call failed", ex);
        return build(HttpStatus.SERVICE_UNAVAILABLE, localize(StorageErrorCode.UNAVAILABLE), request);
    }

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeign(FeignException ex, HttpServletRequest request) {
        log.error("Call to another service failed", ex);
        return build(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Dịch vụ liên quan đang không phản hồi. Vui lòng thử lại sau.",
                request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnhandled(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.", request);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(
                        status.value(), status.getReasonPhrase(), message, request.getRequestURI(), Instant.now()));
    }

    private String localize(StorageErrorCode errorCode, Object... args) {
        return messageSource.getMessage(errorCode.getMessageKey(), args, LocaleContextHolder.getLocale());
    }
}
