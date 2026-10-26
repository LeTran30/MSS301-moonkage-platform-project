package com.moonkage.vendor.common.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Object[] args;

    /** The request field the error belongs to, so the client can show it at that field; null for the whole request. */
    private final String field;

    public AppException(ErrorCode errorCode, Object... args) {
        this(errorCode, null, args);
    }

    private AppException(ErrorCode errorCode, String field, Object[] args) {
        super(errorCode.getMessageKey());
        this.errorCode = errorCode;
        this.field = field;
        this.args = args;
    }

    /** The same error, reported at request field {@code field} (e.g. a value object built from that field). */
    public AppException atField(String field) {
        return new AppException(errorCode, field, args);
    }
}
