package com.moonkage.quotation.common.exception;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonErrorCode;
import com.moonkage.api.CommonExceptionHandler;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import java.text.MessageFormat;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns every error into {@link ApiResponse} with {@code data = null}.
 *
 * <p>The framework failures (a body that cannot be read, an unknown path, a wrong method, a missing query
 * parameter, a call to another service that failed, a failure nobody expected) are answered by
 * {@link CommonExceptionHandler}, the shared boundary every service uses. This advice adds the ones that are
 * quotation's own: its business errors ({@code AppException}) and the refusal of a request that skipped the gateway.
 *
 * <p>The advice is registered here, not only in the shared boundary: {@code @RestControllerAdvice} is not inherited,
 * so a subclass without the annotation would never be asked for its own handlers.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends CommonExceptionHandler {

    /**
     * The wording of the common failures, in quotation's own words.
     *
     * <p>quotation keeps no message bundle of its own: its {@code ErrorCode} holds the text itself, so the shared
     * boundary asks this advice for the wording instead of reading a bundle. Every text is the one the service already
     * answered with, so a client sees the same words as before the shared boundary was introduced.
     */
    private static final Map<CommonErrorCode, String> MESSAGES = Map.ofEntries(
            Map.entry(CommonErrorCode.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR.getMessage()),
            Map.entry(CommonErrorCode.INVALID_INPUT, ErrorCode.INVALID_INPUT.getMessage()),
            Map.entry(CommonErrorCode.MALFORMED_JSON, ErrorCode.MALFORMED_JSON.getMessage()),
            Map.entry(CommonErrorCode.UNAUTHENTICATED, ErrorCode.UNAUTHENTICATED.getMessage()),
            Map.entry(CommonErrorCode.ACCESS_DENIED, ErrorCode.ACCESS_DENIED.getMessage()),
            Map.entry(CommonErrorCode.RESOURCE_NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND.getMessage()),
            Map.entry(CommonErrorCode.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED.getMessage()),
            Map.entry(CommonErrorCode.INVALID_STATE_TRANSITION, ErrorCode.INVALID_STATE_TRANSITION.getMessage()),
            Map.entry(CommonErrorCode.DEPENDENCY_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE.getMessage()),
            // quotation has no required query parameter, so no code of its own for this one
            Map.entry(CommonErrorCode.PARAMETER_REQUIRED, "Thiếu tham số bắt buộc {0}."));

    /** quotation keeps no message bundle, so the shared boundary is built without one. */
    public GlobalExceptionHandler() {
        super(null);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex, HttpServletRequest request) {
        log.warn("Business exception: code={}, message={}", ex.getErrorCode().getCode(), ex.getMessage());
        return build(ex.getErrorCode(), ex.getMessage(), null, request);
    }

    /**
     * X-Account-Id is set by the gateway from the access token; missing means the call skipped it.
     *
     * <p>The shared boundary does not cover a missing header: that failure is a security one, so each service
     * answers it with its own wording.
     */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(ErrorCode.UNAUTHENTICATED, request);
    }

    /**
     * The text of a common failure, in quotation's own words.
     *
     * <p>The shared boundary would read the text from a message bundle; quotation has none, so the wording comes from
     * this advice and stays the service's own. A text that holds a {@code {0}} placeholder (the state transition, the
     * name of a missing parameter) is formatted with the arguments the shared boundary passes in.
     */
    @Override
    protected String localize(CommonErrorCode errorCode, Object[] args) {
        String text = MESSAGES.get(errorCode);
        if (text == null) {
            // a code quotation has no wording for: the shared default is better than showing the key
            return super.localize(errorCode, args);
        }
        return args == null ? text : MessageFormat.format(text, args);
    }

    /**
     * How a failure nobody expected is written down, in quotation's own words.
     *
     * <p>Only the wording of the log line is the service's own; the answer itself is the shared one.
     */
    @Override
    protected void logUnhandled(Exception ex) {
        log.error("Unhandled exception", ex);
    }

    /**
     * How a call to another service that failed is written down, in quotation's own words.
     *
     * <p>Only the wording of the log line is the service's own; the answer itself is the shared one.
     */
    @Override
    protected void logFeign(FeignException ex) {
        log.error("Call to another service failed", ex);
    }

    private ResponseEntity<ApiResponse<Void>> build(ErrorCode errorCode, HttpServletRequest request) {
        return build(errorCode, errorCode.getMessage(), null, request);
    }

    private ResponseEntity<ApiResponse<Void>> build(
            ErrorCode errorCode, String message, List<ApiResponse.FieldError> errors, HttpServletRequest request) {
        return ResponseEntity.status(errorCode.getHttpStatus())
                .body(ApiResponse.error(
                        errorCode.getHttpStatus(), errorCode.getCode(), message, errors, request.getRequestURI()));
    }
}
