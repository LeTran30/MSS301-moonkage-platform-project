package com.moonkage.identity.platform.web;

import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.platform.web.validation.InvalidFields;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.CommonError;
import com.moonkage.identity.shared.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Turns every error into {@link ApiResponse} with {@code data = null}. Token errors arrive here already as
 * AppException (the token adapter converts them), so there is no handler for the JWT library's own exceptions.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorCode ec = ex.getErrorCode();
        String message = localize(ec, ex.getArgs());
        log.warn("Business Exception: code={}, message={}", ec.code(), message);
        return build(ec, message, null, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return build(CommonError.INVALID_INPUT, localize(CommonError.INVALID_INPUT, null), fieldErrors, request);
    }

    /** Fields a request refused while parsing itself into value objects (plan v2, 6.2): same shape as above. */
    @ExceptionHandler(InvalidFields.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidFields(InvalidFields ex, HttpServletRequest request) {
        List<ApiResponse.FieldError> fieldErrors = ex.rejections().stream()
                .map(r -> new ApiResponse.FieldError(r.field(), localize(r)))
                .toList();
        return build(CommonError.INVALID_INPUT, localize(CommonError.INVALID_INPUT, null), fieldErrors, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(CommonError.MALFORMED_JSON, request);
    }

    /**
     * A path nothing serves. Without this the catch-all below would answer 500 and log an error. Spring Boot reports it
     * as NoResourceFoundException (the static resource handler matches every path); without that handler it is
     * NoHandlerFoundException.
     */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNoResource(Exception ex, HttpServletRequest request) {
        return build(CommonError.RESOURCE_NOT_FOUND, request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return build(CommonError.METHOD_NOT_ALLOWED, request);
    }

    /** Spring Security refusing the caller inside MVC; logins never get here, they answer with AppException. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthException(
            AuthenticationException ex, HttpServletRequest request) {
        return build(BearerTokenError.TOKEN_INVALID, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(CommonError.ACCESS_DENIED, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUncaughtException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled Exception: ", ex);
        return build(CommonError.INTERNAL_SERVER_ERROR, request);
    }

    private ResponseEntity<ApiResponse<Void>> build(ErrorCode errorCode, HttpServletRequest request) {
        return build(errorCode, localize(errorCode, null), null, request);
    }

    private ResponseEntity<ApiResponse<Void>> build(
            ErrorCode errorCode, String message, List<ApiResponse.FieldError> errors, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(errorCode.httpStatus());
        return ResponseEntity.status(status)
                .body(ApiResponse.error(status, errorCode.code(), message, errors, request.getRequestURI()));
    }

    private String localize(ErrorCode errorCode, Object[] args) {
        return messageSource.getMessage(errorCode.messageKey(), args, LocaleContextHolder.getLocale());
    }

    /**
     * Field messages use named placeholders like Bean Validation ({@code {max}}), not MessageFormat indexes: the raw
     * message is read without arguments, then each {@code {name}} is replaced.
     */
    private String localize(FieldParser.FieldRejection rejection) {
        String message = messageSource.getMessage(rejection.messageKey(), null, LocaleContextHolder.getLocale());
        for (Map.Entry<String, Object> arg : rejection.cause().args().entrySet()) {
            message = message.replace("{" + arg.getKey() + "}", String.valueOf(arg.getValue()));
        }
        return message;
    }
}
