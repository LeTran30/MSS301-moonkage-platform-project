package com.moonkage.identity.auth;

import com.moonkage.identity.shared.error.ErrorCode;

/** Business rules of the auth module that fail. Codes and message keys are the ones clients already know. */
public enum AuthError implements ErrorCode {
    /** Unknown identifier and wrong password look the same, so a stranger learns nothing (FR-02). */
    INVALID_CREDENTIALS("AUTH_001", 401, "error.auth.invalid_credentials"),
    ACCOUNT_NOT_ACTIVATED("AUTH_002", 403, "error.auth.account_not_activated"),
    REFRESH_TOKEN_INVALID("AUTH_006", 401, "error.auth.refresh_token_invalid"),
    EMAIL_DELIVERY_FAILED("AUTH_013", 503, "error.auth.email_delivery_failed");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    AuthError(String code, int httpStatus, String messageKey) {
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
