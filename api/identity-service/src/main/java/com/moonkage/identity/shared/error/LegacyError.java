package com.moonkage.identity.shared.error;

/**
 * Module errors not moved yet (plan v2, phase 3 step 2). Each later phase moves its module's codes to a
 * {@code <Module>Error} enum and deletes them here; phase 9 deletes this enum.
 */
public enum LegacyError implements ErrorCode {
    ADDRESS_NOT_FOUND("ADDRESS_001", 404, "error.address.not_found");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    LegacyError(String code, int httpStatus, String messageKey) {
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
