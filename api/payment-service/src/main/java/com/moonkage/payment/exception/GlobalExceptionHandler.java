package com.moonkage.payment.exception;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
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
        return build(ec, message, null, request);
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
