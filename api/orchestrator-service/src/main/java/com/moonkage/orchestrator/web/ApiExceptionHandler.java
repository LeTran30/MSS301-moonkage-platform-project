package com.moonkage.orchestrator.web;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonErrorCode;
import com.moonkage.api.CommonExceptionHandler;
import com.moonkage.orchestrator.application.NotificationNotFoundException;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Central error boundary of orchestrator-service.
 *
 * <p>Every answer carries the same envelope (BE-03), so the web reads a failure the same way it reads a success.
 *
 * <p>The framework failures are answered by {@link CommonExceptionHandler}, the shared boundary every service uses.
 * This advice adds the ones that are orchestrator's own: the notification that does not exist, the refusal of a
 * request that skipped the gateway and the argument that is not valid.
 *
 * <p>orchestrator names its failures with its own code strings ({@code NOTIFICATION_NOT_FOUND},
 * {@code UNAUTHENTICATED}, {@code INVALID_REQUEST}, {@code INTERNAL_ERROR}), not the shared {@code COMMON_*} ones,
 * so the shared boundary is told to keep orchestrator's wording through the {@link #code} and {@link #message}
 * hooks. The web and the scripts around it already read those strings, so they must not become {@code COMMON_404},
 * {@code COMMON_401}, {@code COMMON_400} or {@code COMMON_500}.
 *
 * <p>Two of the shared answers are deliberately pulled back to what orchestrator answered before, so that this
 * service takes over only the framework failures every other service already answers the same way: a missing query
 * parameter and a failed call to another service stay a 500 here, the way they were.
 *
 * <p>The advice is registered here, not only in the shared boundary: {@code @RestControllerAdvice} is not inherited,
 * so a subclass without the annotation would never be asked for its own handlers.
 */
@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler extends CommonExceptionHandler {

    /** The code string of a failure nobody expected, in orchestrator's own words. */
    private static final String INTERNAL_ERROR_CODE = "INTERNAL_ERROR";
    /** The code string of a notification that does not exist, in orchestrator's own words. */
    private static final String NOT_FOUND_CODE = "NOTIFICATION_NOT_FOUND";
    /** The code string of a request the service refused, in orchestrator's own words. */
    private static final String INVALID_REQUEST_CODE = "INVALID_REQUEST";
    /** The code string of a request that came without the gateway's headers. */
    private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";

    /** The wording of a failure nobody expected, in orchestrator's own words. */
    private static final String INTERNAL_ERROR_MESSAGE = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.";
    /** The wording of a notification that does not exist, in orchestrator's own words. */
    private static final String NOT_FOUND_MESSAGE = "Không tìm thấy thông báo";
    /** The wording of a request that came without the gateway's headers. */
    private static final String UNAUTHENTICATED_MESSAGE = "Thiếu thông tin đăng nhập";

    /** orchestrator keeps no message bundle, so the shared boundary is built without one. */
    public ApiExceptionHandler() {
        super(null);
    }

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            NotificationNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(
                        HttpStatus.NOT_FOUND, NOT_FOUND_CODE, NOT_FOUND_MESSAGE, request.getRequestURI()));
    }

    /**
     * X-Account-Id is set by the gateway; missing means the call did not come through it with a token.
     *
     * <p>The shared boundary does not cover a missing header: that failure is a security one, so each service
     * answers it with its own wording.
     */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(
                        HttpStatus.UNAUTHORIZED,
                        UNAUTHENTICATED_CODE,
                        UNAUTHENTICATED_MESSAGE,
                        request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalid(IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        HttpStatus.BAD_REQUEST, INVALID_REQUEST_CODE, ex.getMessage(), request.getRequestURI()));
    }

    /**
     * The code string of a common failure, in orchestrator's own words.
     *
     * <p>The shared boundary names a failure the {@code COMMON_*} way; orchestrator names the same failures its own
     * way, and the web already reads those strings. A common failure orchestrator has no string of its own (a wrong
     * method, a service that did not answer) keeps the shared one.
     */
    @Override
    protected String code(CommonErrorCode errorCode) {
        return switch (errorCode) {
            case RESOURCE_NOT_FOUND -> NOT_FOUND_CODE;
            case UNAUTHENTICATED -> UNAUTHENTICATED_CODE;
            case INVALID_INPUT, MALFORMED_JSON, PARAMETER_REQUIRED -> INVALID_REQUEST_CODE;
            case INTERNAL_SERVER_ERROR -> INTERNAL_ERROR_CODE;
            default -> super.code(errorCode);
        };
    }

    /**
     * The text of a common failure, in orchestrator's own words.
     *
     * <p>Only the failures orchestrator already answered itself keep their own text; a failure it takes over from
     * the shared boundary gets the shared wording.
     */
    @Override
    protected String message(CommonErrorCode errorCode) {
        return switch (errorCode) {
            case RESOURCE_NOT_FOUND -> NOT_FOUND_MESSAGE;
            case UNAUTHENTICATED -> UNAUTHENTICATED_MESSAGE;
            case INTERNAL_SERVER_ERROR -> INTERNAL_ERROR_MESSAGE;
            default -> super.message(errorCode);
        };
    }

    /**
     * A required query parameter is missing.
     *
     * <p>orchestrator never answered this one itself, so it used to fall through to the catch-all and became a 500.
     * It keeps that answer: this service takes over only the framework failures every other service already answers
     * the same way.
     */
    @Override
    protected ResponseEntity<ApiResponse<Void>> missingParameterAnswer(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        return uncaughtAnswer(ex, request);
    }

    /**
     * A call to another service failed.
     *
     * <p>orchestrator never answered this one itself, so it used to fall through to the catch-all and became a 500.
     * It keeps that answer, for the same reason as the missing query parameter.
     */
    @Override
    protected ResponseEntity<ApiResponse<Void>> feignAnswer(FeignException ex, HttpServletRequest request) {
        return uncaughtAnswer(ex, request);
    }

    /**
     * How a failure nobody expected is written down, in orchestrator's own words.
     *
     * <p>Only the wording of the log line is the service's own; the answer itself is the shared one, with
     * orchestrator's code string and text.
     */
    @Override
    protected void logUnhandled(Exception ex) {
        log.error("Unexpected error", ex);
    }
}
