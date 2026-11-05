package com.moonkage.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * The one body every public API answer carries (Software Design 5.1 rule 8): success and error alike have
 * {@code status, code, message, data, timestamp}.
 *
 * <p>It lives in {@code common-api} so that all seven services answer with byte-identical JSON: the web reads
 * {@code data} for a success and {@code code}/{@code message} for a failure, and it never has to guess which
 * envelope it got.
 *
 * <p>On success {@code code} is {@value #SUCCESS_CODE} and {@code message} is {@value #SUCCESS_MESSAGE}; on an error
 * {@code code} is the service's own error code (e.g. {@code AUTH_007}), {@code data} is null and {@code path} names
 * the request. Internal APIs ({@code /internal/**}) answer their payload unwrapped.
 *
 * @param status HTTP status code, the same as the response's
 * @param errors the invalid fields, only for a validation error
 * @param path the request path, only on an error
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

    /** One invalid field of a request; the client shows the message at that field. */
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

    /** An error without an invalid field. */
    public static ApiResponse<Void> error(HttpStatus status, String code, String message, String path) {
        return error(status, code, message, null, path);
    }

    /** An error; {@code errors} names the invalid fields, or is null when the whole request is wrong. */
    public static ApiResponse<Void> error(
            HttpStatus status, String code, String message, List<FieldError> errors, String path) {
        return new ApiResponse<>(status.value(), code, message, null, errors, path, Instant.now());
    }

    /** An error whose status is already a number (a status of another service's answer). */
    public static ApiResponse<Void> error(int status, String code, String message, String path) {
        return new ApiResponse<>(status, code, message, null, null, path, Instant.now());
    }

    /** An error whose status is already a number and that names the invalid fields. */
    public static ApiResponse<Void> error(
            int status, String code, String message, List<FieldError> errors, String path) {
        return new ApiResponse<>(status, code, message, null, errors, path, Instant.now());
    }

    private static <T> ApiResponse<T> success(HttpStatus status, T data) {
        return new ApiResponse<>(status.value(), SUCCESS_CODE, SUCCESS_MESSAGE, data, null, null, Instant.now());
    }
}
