package com.moonkage.identity.common.exception;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns every error into {@link ApiResponse} with {@code data = null}. Token errors arrive here already as
 * AppException (JwtTokenProvider converts them), so there is no handler for the JWT library's own exceptions.
 *
 * <p>The framework failures (a body that cannot be read, an unknown path, a wrong method, a failure nobody expected)
 * are answered by {@link CommonExceptionHandler}, the shared boundary every service uses; this advice adds the
 * ones that are identity's own: its business errors and the refusals of Spring Security.
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

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(Exception ex, HttpServletRequest request) {
        return build(ErrorCode.INVALID_CREDENTIALS, request);
    }

    /** The only account state Spring Security can refuse is "e-mail not confirmed" (Account.isEnabled). */
    @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccountStatus(
            AccountStatusException ex, HttpServletRequest request) {
        return build(ErrorCode.ACCOUNT_NOT_ACTIVATED, request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthException(
            AuthenticationException ex, HttpServletRequest request) {
        return build(ErrorCode.TOKEN_INVALID, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(ErrorCode.ACCESS_DENIED, request);
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
