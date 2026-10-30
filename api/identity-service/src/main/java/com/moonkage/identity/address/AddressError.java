package com.moonkage.identity.address;

import com.moonkage.identity.shared.error.ErrorCode;

/** Business rules of the address module that fail. Codes and message keys are the ones clients already know. */
public enum AddressError implements ErrorCode {
    /** Also for another account's address: it answers like a missing one. */
    NOT_FOUND("ADDRESS_001", 404, "error.address.not_found");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    AddressError(String code, int httpStatus, String messageKey) {
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
