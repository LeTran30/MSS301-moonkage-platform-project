package com.moonkage.identity.otp;

import com.moonkage.identity.shared.error.ErrorCode;

/** Business rules of the otp module that fail. Codes and message keys are the ones clients already know. */
public enum OtpError implements ErrorCode {
    INVALID_OR_EXPIRED("AUTH_005", 400, "error.auth.otp_invalid_or_expired"),
    /** Message argument: seconds left of the cooldown. */
    TOO_FREQUENT("AUTH_014", 429, "error.auth.otp_too_frequent"),
    /** Message arguments: the allowed wrong guesses, minutes left of the lockout. */
    MAX_ATTEMPTS_EXCEEDED("AUTH_015", 429, "error.auth.otp_max_attempts_exceeded"),
    SEND_LIMIT_EXCEEDED("AUTH_016", 429, "error.auth.otp_send_limit_exceeded");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    OtpError(String code, int httpStatus, String messageKey) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.messageKey = messageKey;
    }

    @Override
    public String code() {
        return code;
    }

    @Override
    public int httpStatus() {
        return httpStatus;
    }

    @Override
    public String messageKey() {
        return messageKey;
    }
}
