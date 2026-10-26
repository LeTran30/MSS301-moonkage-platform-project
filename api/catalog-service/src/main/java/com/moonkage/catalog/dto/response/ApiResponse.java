package com.moonkage.catalog.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import org.springframework.http.HttpStatus;

/** New catalog APIs use the public envelope of Software Design 5.1. */
public record ApiResponse<T>(
        int status,
        String code,
        String message,
        T data,
        @JsonInclude(JsonInclude.Include.NON_NULL) String path,
        Instant timestamp) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(HttpStatus.OK.value(), "SUCCESS", "OK", data, null, Instant.now());
    }

    public static ApiResponse<Void> error(int status, String code, String message, String path) {
        return new ApiResponse<>(status, code, message, null, path, Instant.now());
    }
}
