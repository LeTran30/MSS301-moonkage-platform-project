package com.moonkage.identity.dto.response;

import com.moonkage.identity.enums.NfcReasonCode;
import com.moonkage.identity.enums.NfcResult;
import java.time.Instant;

/**
 * Always HTTP 200, also when rejected (the app reads {@code status}). No card data in it: the app already showed
 * the card before sending (AC-04.4).
 */
public record SubmitCardResponse(
        NfcResult status, NfcReasonCode reasonCode, Integer attemptsLeft, Instant lockedUntil) {

    public static SubmitCardResponse verified() {
        return new SubmitCardResponse(NfcResult.VERIFIED, null, null, null);
    }

    public static SubmitCardResponse rejected(NfcReasonCode reasonCode) {
        return new SubmitCardResponse(NfcResult.REJECTED, reasonCode, null, null);
    }

    public static SubmitCardResponse rejected(NfcReasonCode reasonCode, int attemptsLeft, Instant lockedUntil) {
        return new SubmitCardResponse(NfcResult.REJECTED, reasonCode, attemptsLeft, lockedUntil);
    }
}
