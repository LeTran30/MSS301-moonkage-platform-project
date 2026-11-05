package com.moonkage.api;

import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import java.text.MessageFormat;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * The error boundary every service shares: the framework failures that mean the same thing everywhere.
 *
 * <p>They used to be written out again in each service's own {@code GlobalExceptionHandler}, which meant seven copies
 * of the same handlers and seven places to keep them in step (audit findings H-02 and H-03). They live here now, so a
 * service only writes the advice for the exceptions that are its own: its {@code AppException} and its business codes.
 *
 * <p>A service that has advice of its own extends this class, so the shared handlers and the service's own handlers
 * live in one advice and there is no question which of them answers a request. A service that has nothing of its own
 * lets the auto-configuration of common-api register this advice.
 *
 * <p>The handlers are final on purpose: a service that wants to answer one of them differently overrides the protected
 * hook the handler calls ({@link #validationAnswer}, {@link #unreadableAnswer}, {@link #missingParameterAnswer},
 * {@link #noResourceAnswer}, {@link #methodNotAllowedAnswer}, {@link #feignAnswer}, {@link #uncaughtAnswer}) instead of
 * declaring a second handler for the same exception, which Spring would refuse as an ambiguous mapping.
 *
 * <p>The body is the same envelope every service already answers with: {@code {status, code, message, data: null,
 * path, timestamp}}, and the code strings are the {@code COMMON_*} ones, so the web reads a failure the same way
 * everywhere. The text of the message comes from the service's own {@code messages.properties}, so the wording stays
 * the service's own; {@link #DEFAULT_MESSAGES} holds the wording of the services that do not keep a bundle of
 * their own, and is the fallback for a key a service's bundle does not hold.
 *
 * <p>Where two services disagreed about the same exception, the stricter and more specific answer wins, and the choice
 * is written down at the handler:
 *
 * <ul>
 *   <li>{@code MissingServletRequestParameterException}: only order-service had a handler for it and answered 400 with
 *       the parameter named; the others fell through to their 500 handler. The 400 with the named parameter is kept.
 *   <li>{@code MethodArgumentTypeMismatchException}: identity-service alone answered 400 for it, the others only for
 *       {@code HttpMessageNotReadableException}. Both are answered with 400 now.
 * </ul>
 *
 * <p>The advice is ordered last on purpose: a service's own advice answers the exceptions that are its business (its
 * {@code AppException}, its security exceptions) and this one answers everything else, including the catch-all.
 */
@Slf4j
@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
public class CommonExceptionHandler {

    /** The wording of the services that do not keep a bundle of their own; the fallback for a key a bundle lacks. */
    private static final Map<CommonErrorCode, String> DEFAULT_MESSAGES = Map.ofEntries(
            Map.entry(CommonErrorCode.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."),
            Map.entry(CommonErrorCode.INVALID_INPUT, "Dữ liệu đầu vào không hợp lệ."),
            Map.entry(CommonErrorCode.MALFORMED_JSON, "Định dạng dữ liệu gửi lên không đúng."),
            Map.entry(CommonErrorCode.PARAMETER_REQUIRED, "Thiếu tham số bắt buộc {0}."),
            Map.entry(CommonErrorCode.UNAUTHENTICATED, "Thiếu thông tin đăng nhập."),
            Map.entry(CommonErrorCode.ACCESS_DENIED, "Bạn không có quyền thực hiện hành động này."),
            Map.entry(CommonErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đường dẫn yêu cầu."),
            Map.entry(CommonErrorCode.METHOD_NOT_ALLOWED, "Phương thức HTTP không được hỗ trợ cho đường dẫn này."),
            Map.entry(CommonErrorCode.INVALID_STATE_TRANSITION, "Thao tác không hợp lệ với trạng thái hiện tại."),
            Map.entry(
                    CommonErrorCode.DEPENDENCY_UNAVAILABLE,
                    "Dịch vụ liên quan đang không phản hồi. Vui lòng thử lại sau."),
            Map.entry(CommonErrorCode.FIELD_REQUIRED, "Bắt buộc."),
            Map.entry(CommonErrorCode.TEXT_TOO_LONG, "Tối đa {0} ký tự."),
            Map.entry(CommonErrorCode.PROVINCE_CODE_INVALID, "Mã tỉnh/thành phố không hợp lệ."),
            Map.entry(CommonErrorCode.PRICE_INVALID, "Số tiền phải là số nguyên VND lớn hơn 0."),
            Map.entry(CommonErrorCode.QUANTITY_INVALID, "Số lượng phải là số nguyên lớn hơn 0."),
            Map.entry(
                    CommonErrorCode.PRICE_TIERS_INVALID,
                    "Bậc giá không hợp lệ: mỗi bậc bắt đầu ở một số lượng khác nhau."),
            Map.entry(CommonErrorCode.NOT_IMPLEMENTED, "Chức năng này chưa được triển khai."));

    /** The service's own texts; null when the service has no message bundle of its own. */
    protected final MessageSource messageSource;

    public CommonExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /** A request field that is not valid: the answer names every field that is wrong. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public final ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        return validationAnswer(ex, request);
    }

    /** A body that cannot be read, and a parameter of the wrong type: both are a bad request. */
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public final ResponseEntity<ApiResponse<Void>> handleUnreadable(Exception ex, HttpServletRequest request) {
        return unreadableAnswer(ex, request);
    }

    /**
     * A required query parameter is missing. Without this handler the request fell through to the catch-all and was
     * answered with a 500, which hid the real problem from the caller.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public final ResponseEntity<ApiResponse<Void>> handleMissingParameter(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        return missingParameterAnswer(ex, request);
    }

    /**
     * A path nothing serves. Without this the catch-all below would answer 500 and log an error. Spring Boot reports it
     * as NoResourceFoundException (the static resource handler matches every path); without that handler it is
     * NoHandlerFoundException.
     */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public final ResponseEntity<ApiResponse<Void>> handleNoResource(Exception ex, HttpServletRequest request) {
        return noResourceAnswer(ex, request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public final ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return methodNotAllowedAnswer(ex, request);
    }

    /**
     * A Feign call that the service did not turn into an AppException: the other service is down, timed out or failed.
     * The caller gets 503, never the other service's body.
     */
    @ExceptionHandler(FeignException.class)
    public final ResponseEntity<ApiResponse<Void>> handleFeign(FeignException ex, HttpServletRequest request) {
        return feignAnswer(ex, request);
    }

    /** Anything the service did not expect: the caller gets a 500 and the answer carries no detail of the failure. */
    @ExceptionHandler(Exception.class)
    public final ResponseEntity<ApiResponse<Void>> handleUncaughtException(Exception ex, HttpServletRequest request) {
        return uncaughtAnswer(ex, request);
    }

    /** The answer for a request with a field that is not valid. */
    protected ResponseEntity<ApiResponse<Void>> validationAnswer(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return build(CommonErrorCode.INVALID_INPUT, message(CommonErrorCode.INVALID_INPUT), fieldErrors, request);
    }

    /** The answer for a body that cannot be read. */
    protected ResponseEntity<ApiResponse<Void>> unreadableAnswer(Exception ex, HttpServletRequest request) {
        return build(CommonErrorCode.MALFORMED_JSON, request);
    }

    /** The answer for a missing query parameter, naming the parameter. */
    protected ResponseEntity<ApiResponse<Void>> missingParameterAnswer(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        String message = localize(CommonErrorCode.PARAMETER_REQUIRED, new Object[] {ex.getParameterName()});
        return build(
                CommonErrorCode.PARAMETER_REQUIRED,
                message,
                List.of(new ApiResponse.FieldError(ex.getParameterName(), message)),
                request);
    }

    /** The answer for a path nothing serves. */
    protected ResponseEntity<ApiResponse<Void>> noResourceAnswer(Exception ex, HttpServletRequest request) {
        return build(CommonErrorCode.RESOURCE_NOT_FOUND, request);
    }

    /** The answer for a method the path does not serve. */
    protected ResponseEntity<ApiResponse<Void>> methodNotAllowedAnswer(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return build(CommonErrorCode.METHOD_NOT_ALLOWED, request);
    }

    /** The answer for a call to another service that failed. */
    protected ResponseEntity<ApiResponse<Void>> feignAnswer(FeignException ex, HttpServletRequest request) {
        logFeign(ex);
        return build(CommonErrorCode.DEPENDENCY_UNAVAILABLE, request);
    }

    /** The answer for a failure nobody expected. */
    protected ResponseEntity<ApiResponse<Void>> uncaughtAnswer(Exception ex, HttpServletRequest request) {
        logUnhandled(ex);
        return build(CommonErrorCode.INTERNAL_SERVER_ERROR, request);
    }

    /** The answer for {@code errorCode}, with the text of the service's own bundle. */
    protected ResponseEntity<ApiResponse<Void>> build(CommonErrorCode errorCode, HttpServletRequest request) {
        return build(errorCode, message(errorCode), null, request);
    }

    /** The answer for {@code errorCode}, with a text the service chose itself. */
    protected ResponseEntity<ApiResponse<Void>> build(
            CommonErrorCode errorCode,
            String message,
            List<ApiResponse.FieldError> errors,
            HttpServletRequest request) {
        HttpStatus status = status(errorCode);
        return ResponseEntity.status(status)
                .body(ApiResponse.error(status.value(), code(errorCode), message, errors, request.getRequestURI()));
    }

    /** The status of an error code; a service that answers one of them differently overrides this. */
    protected HttpStatus status(CommonErrorCode errorCode) {
        return errorCode.getHttpStatus();
    }

    /** The code string of an error code; a service that names one of them differently overrides this. */
    protected String code(CommonErrorCode errorCode) {
        return errorCode.getCode();
    }

    /** The text of an error code, taken from the service's own {@code messages.properties}. */
    protected String message(CommonErrorCode errorCode) {
        return localize(errorCode, null);
    }

    /**
     * The text of an error code in the service's own bundle. A service without a bundle of its own keeps the default
     * text, and so does a key the bundle does not hold.
     */
    protected String localize(CommonErrorCode errorCode, Object[] args) {
        String key = errorCode.getMessageKey();
        String text = null;
        if (messageSource != null) {
            try {
                text = messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
            } catch (NoSuchMessageException ex) {
                text = null;
            }
        }
        // a bundle that falls back to the code as the message holds no text of its own for this key
        if (text == null || text.equals(key)) {
            String defaultText = DEFAULT_MESSAGES.get(errorCode);
            if (defaultText == null) {
                return key;
            }
            text = args == null ? defaultText : MessageFormat.format(defaultText, args);
        }
        return text;
    }

    /** How a failure nobody expected is written down; a service with its own wording overrides this. */
    protected void logUnhandled(Exception ex) {
        log.error("Unhandled Exception: ", ex);
    }

    /** How a call to another service that failed is written down; a service with its own wording overrides this. */
    protected void logFeign(FeignException ex) {
        log.error("Call to another service failed: status={}, {}", ex.status(), ex.getMessage());
    }
}
