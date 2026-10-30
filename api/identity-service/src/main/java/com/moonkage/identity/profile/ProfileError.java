package com.moonkage.identity.profile;

import com.moonkage.identity.shared.error.ErrorCode;

/** Business rules of the profile module that fail. Codes and message keys are the ones clients already know. */
public enum ProfileError implements ErrorCode {
    NOT_FOUND("USER_002", 404, "error.user.profile_not_found"),
    KYC_ALREADY_VERIFIED("NFC_001", 409, "error.nfc.already_verified"),
    ID_NUMBER_INVALID("NFC_005", 400, "error.nfc.id_number_invalid");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    ProfileError(String code, int httpStatus, String messageKey) {
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
