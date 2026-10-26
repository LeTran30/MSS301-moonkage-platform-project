package com.moonkage.quotation.common.exception;

import java.text.MessageFormat;
import lombok.Getter;

/** An expected business error; GlobalExceptionHandler turns it into ApiResponse with the ErrorCode's status. */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode, Object... args) {
        super(MessageFormat.format(errorCode.getMessage(), args));
        this.errorCode = errorCode;
    }
}
