package com.moonkage.identity.account;

import com.moonkage.identity.shared.error.ErrorCode;

/** Business rules of the account module that fail. Codes and message keys are the ones clients already know. */
public enum AccountError implements ErrorCode {
    EMAIL_ALREADY_EXISTS("AUTH_007", 409, "error.auth.email_already_exists"),
    PHONE_ALREADY_EXISTS("AUTH_008", 409, "error.auth.phone_already_exists"),
    NOT_FOUND("USER_001", 404, "error.user.account_not_found");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    AccountError(String code, int httpStatus, String messageKey) {
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
