package com.moonkage.vendor.common.exception;

import java.util.List;
import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Object[] args;

    /** The request field the error belongs to, so the client can show it at that field; null for the whole request. */
    private final String field;

    /** More than one field the same error belongs to (e.g. each product out of stock); {@code field} is the first. */
    private final List<String> fields;

    public AppException(ErrorCode errorCode, Object... args) {
        this(errorCode, List.of(), args);
    }

    private AppException(ErrorCode errorCode, List<String> fields, Object[] args) {
        super(errorCode.getMessageKey());
        this.errorCode = errorCode;
        this.fields = List.copyOf(fields);
        this.field = fields.isEmpty() ? null : fields.getFirst();
        this.args = args;
    }

    /** The same error, reported at request field {@code field} (e.g. a value object built from that field). */
    public AppException atField(String field) {
        return new AppException(errorCode, List.of(field), args);
    }

    /** The same error, reported at each of {@code fields}, in that order. */
    public AppException atFields(List<String> fields) {
        return new AppException(errorCode, fields, args);
    }
}
