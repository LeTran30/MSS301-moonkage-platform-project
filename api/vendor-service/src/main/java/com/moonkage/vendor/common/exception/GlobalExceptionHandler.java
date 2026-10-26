package com.moonkage.vendor.common.exception;

import com.moonkage.storage.InvalidFileException;
import com.moonkage.storage.StorageUnavailableException;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Turns every error into {@link ApiResponse} with {@code data = null}. */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorCode ec = ex.getErrorCode();
        String message = localize(ec, ex.getArgs());
        log.warn("Business Exception: code={}, message={}", ec.getCode(), message);
        List<ApiResponse.FieldError> fieldErrors =
                ex.getField() == null ? null : List.of(new ApiResponse.FieldError(ex.getField(), message));
        return build(ec, message, fieldErrors, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return build(ErrorCode.INVALID_INPUT, localize(ErrorCode.INVALID_INPUT, null), fieldErrors, request);
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

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(ErrorCode.MALFORMED_JSON, request);
    }

    /**
     * A path nothing serves. Without this the catch-all below would answer 500 and log an error. Spring Boot reports it
     * as NoResourceFoundException (the static resource handler matches every path); without that handler it is
     * NoHandlerFoundException.
     */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNoResource(Exception ex, HttpServletRequest request) {
        return build(ErrorCode.RESOURCE_NOT_FOUND, request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return build(ErrorCode.METHOD_NOT_ALLOWED, request);
    }

    /**
     * A Feign call that its client's error decoder did not turn into an AppException: the other service is down,
     * timed out or failed. The caller gets 503, never the other service's body.
     */
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ApiResponse<Void>> handleFeign(FeignException ex, HttpServletRequest request) {
        log.error("Call to another service failed: status={}, {}", ex.status(), ex.getMessage());
        return build(ErrorCode.DEPENDENCY_UNAVAILABLE, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUncaughtException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled Exception: ", ex);
        return build(ErrorCode.INTERNAL_SERVER_ERROR, request);
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
