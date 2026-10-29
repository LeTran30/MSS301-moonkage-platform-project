package com.moonkage.identity.shared.error;

/**
 * Module errors not moved yet (plan v2, phase 3 step 2). Each later phase moves its module's codes to a
 * {@code <Module>Error} enum and deletes them here; phase 9 deletes this enum.
 */
public enum LegacyError implements ErrorCode {

    // Auth
    INVALID_CREDENTIALS("AUTH_001", 401, "error.auth.invalid_credentials"),
    ACCOUNT_NOT_ACTIVATED("AUTH_002", 403, "error.auth.account_not_activated"),
    REFRESH_TOKEN_INVALID("AUTH_006", 401, "error.auth.refresh_token_invalid"),
    MISSING_BEARER_TOKEN("AUTH_010", 401, "error.auth.missing_bearer_token"),
    TOKEN_EXPIRED("AUTH_011", 401, "error.auth.token_expired"),
    TOKEN_INVALID("AUTH_012", 401, "error.auth.token_invalid"),
    EMAIL_DELIVERY_FAILED("AUTH_013", 503, "error.auth.email_delivery_failed"),

    // User & Address
    USER_PROFILE_NOT_FOUND("USER_002", 404, "error.user.profile_not_found"),
    ADDRESS_NOT_FOUND("ADDRESS_001", 404, "error.address.not_found"),

    // NFC verification (FR-04). Card rejections are not errors: they come back as SubmitCardResponse.
    NFC_ALREADY_VERIFIED("NFC_001", 409, "error.nfc.already_verified"),
    NFC_LOCKED("NFC_002", 429, "error.nfc.locked"),
    NFC_SESSION_EXPIRED("NFC_003", 410, "error.nfc.session_expired"),
    NFC_SESSION_NOT_OWNED("NFC_004", 403, "error.nfc.session_not_owned"),
    ID_NUMBER_INVALID("NFC_005", 400, "error.nfc.id_number_invalid");

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
