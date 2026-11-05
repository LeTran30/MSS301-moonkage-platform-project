package com.moonkage.vendor.common.exception;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonExceptionHandler;
import com.moonkage.storage.InvalidFileException;
import com.moonkage.storage.StorageUnavailableException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns every error into {@link ApiResponse} with {@code data = null}.
 *
 * <p>The advice is registered here, not only in the shared boundary: {@code @RestControllerAdvice} is not inherited,
 * so a subclass without the annotation would never be asked for its own handlers.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends CommonExceptionHandler {

    public GlobalExceptionHandler(MessageSource messageSource) {
        super(messageSource);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorCode ec = ex.getErrorCode();
        String message = localize(ec, ex.getArgs());
        log.warn("Business Exception: code={}, message={}", ec.getCode(), message);
        List<ApiResponse.FieldError> fieldErrors = ex.getFields().isEmpty()
                ? null
                : ex.getFields().stream()
                        .map(field -> new ApiResponse.FieldError(field, message))
                        .toList();
        return build(ec, message, fieldErrors, request);
    }

    /** An upload that is missing, of another type, too large or not the declared format (common-storage). */
    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidFile(InvalidFileException ex, HttpServletRequest request) {
        String message = messageSource.getMessage(
                ex.getErrorCode().getMessageKey(), ex.getMessageArgs(), LocaleContextHolder.getLocale());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        HttpStatus.BAD_REQUEST, ex.getErrorCode().getCode(), message, null, request.getRequestURI()));
    }

    @ExceptionHandler(StorageUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageUnavailable(
            StorageUnavailableException ex, HttpServletRequest request) {
        log.error("MinIO did not answer: {}", ex.getMessage());
        return build(ErrorCode.DEPENDENCY_UNAVAILABLE, request);
    }

    /** X-Account-Id is set by the gateway from the access token; missing means the call skipped it. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(ErrorCode.UNAUTHENTICATED, request);
    }

    private ResponseEntity<ApiResponse<Void>> build(ErrorCode errorCode, HttpServletRequest request) {
        return build(errorCode, localize(errorCode, null), null, request);
    }

    private ResponseEntity<ApiResponse<Void>> build(
            ErrorCode errorCode, String message, List<ApiResponse.FieldError> errors, HttpServletRequest request) {
        return ResponseEntity.status(errorCode.getHttpStatus())
                .body(ApiResponse.error(
                        errorCode.getHttpStatus(), errorCode.getCode(), message, errors, request.getRequestURI()));
    }

    private String localize(ErrorCode errorCode, Object[] args) {
        return messageSource.getMessage(errorCode.getMessageKey(), args, LocaleContextHolder.getLocale());
    }
}
