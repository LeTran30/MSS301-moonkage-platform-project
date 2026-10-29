package com.moonkage.identity.platform.security;

import com.moonkage.identity.shared.error.ErrorCode;

/**
 * Why a request's bearer token is refused, whoever issued it: the filter answers a missing token, a
 * {@link BearerTokenAuthenticator} the other two. Codes and message keys are the ones clients already know.
 */
public enum BearerTokenError implements ErrorCode {
    MISSING_BEARER_TOKEN("AUTH_010", 401, "error.auth.missing_bearer_token"),
    TOKEN_EXPIRED("AUTH_011", 401, "error.auth.token_expired"),
    TOKEN_INVALID("AUTH_012", 401, "error.auth.token_invalid");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    BearerTokenError(String code, int httpStatus, String messageKey) {
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
