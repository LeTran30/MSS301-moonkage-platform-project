package com.moonkage.identity.platform.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * One body for every public API answer (Software Design 5.1 rule 8): success and error alike carry
 * {@code status, code, message, data, timestamp}. On success {@code code} is {@value #SUCCESS_CODE}; on an error it
 * is the ErrorCode (e.g. AUTH_007), {@code data} is null and {@code path} names the request. Internal APIs
 * (/internal/**) return their payload unwrapped.
 *
 * @param status HTTP status code, the same as the response's
 * @param errors invalid fields, only for a validation error
 */
public record ApiResponse<T>(
        int status,
        String code,
        String message,
        T data,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<FieldError> errors,
        @JsonInclude(JsonInclude.Include.NON_NULL) String path,
        Instant timestamp) {

    public static final String SUCCESS_CODE = "SUCCESS";
    public static final String SUCCESS_MESSAGE = "OK";

    public record FieldError(String field, String message) {}

    /** 200 with a payload. */
    public static <T> ApiResponse<T> ok(T data) {
        return success(HttpStatus.OK, data);
    }

    /** 200 without a payload, e.g. "code sent". */
    public static ApiResponse<Void> ok() {
        return success(HttpStatus.OK, null);
    }

    /** 201 for a created resource. */
    public static <T> ApiResponse<T> created(T data) {
        return success(HttpStatus.CREATED, data);
    }

    public static ApiResponse<Void> error(
            HttpStatus status, String code, String message, List<FieldError> errors, String path) {
        return new ApiResponse<>(status.value(), code, message, null, errors, path, Instant.now());
    }

    private static <T> ApiResponse<T> success(HttpStatus status, T data) {
        return new ApiResponse<>(status.value(), SUCCESS_CODE, SUCCESS_MESSAGE, data, null, null, Instant.now());
    }
}
