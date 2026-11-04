package com.moonkage.orchestrator.contract;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import org.springframework.http.HttpStatus;

/**
 * One body for every public API answer (Software Design 5.1 rule 8): success and error alike carry
 * {@code status, code, message, data, timestamp}.
 *
 * <p>The shape is the one the other services use (BE-03): the web reads {@code data} for a success and
 * {@code code}/{@code message} for a failure, so the client never has to guess which envelope it got.
 *
 * @param status HTTP status code, the same as the response's
 */
public record ApiResponse<T>(
        int status,
        String code,
        String message,
        T data,
        @JsonInclude(JsonInclude.Include.NON_NULL) String path,
        Instant timestamp) {

    public static final String SUCCESS_CODE = "SUCCESS";
    public static final String SUCCESS_MESSAGE = "OK";

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(HttpStatus.OK.value(), SUCCESS_CODE, SUCCESS_MESSAGE, data, null, Instant.now());
    }

    public static ApiResponse<Void> error(HttpStatus status, String code, String message, String path) {
        return new ApiResponse<>(status.value(), code, message, null, path, Instant.now());
    }
}
