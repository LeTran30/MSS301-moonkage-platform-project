package com.moonkage.identity.nfc;

import com.moonkage.identity.shared.error.ErrorCode;

/**
 * Rules of the NFC mechanism that fail: the session and the lockout. A rejected card is not one of them: it comes back
 * as a {@link CardCheck} (AC-04.9). Codes and message keys are the ones clients already know.
 */
public enum NfcError implements ErrorCode {
    LOCKED("NFC_002", 429, "error.nfc.locked"),
    SESSION_EXPIRED("NFC_003", 410, "error.nfc.session_expired"),
    SESSION_NOT_OWNED("NFC_004", 403, "error.nfc.session_not_owned");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    NfcError(String code, int httpStatus, String messageKey) {
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
