package com.moonkage.identity.nfc;

import java.time.Instant;

/**
 * How one card ended.
 *
 * @param reasonCode null when verified
 * @param attemptsLeft null when the card did not count as an attempt
 * @param lockedUntil set when this card locked KYC or found it locked
 */
public record CardCheck(Result result, NfcReasonCode reasonCode, Integer attemptsLeft, Instant lockedUntil) {

    /** The names are sent as they are. */
    public enum Result {
        VERIFIED,
        REJECTED
    }

    public static CardCheck verified() {
        return new CardCheck(Result.VERIFIED, null, null, null);
    }

    /** A card that did not count as an attempt. */
    public static CardCheck rejected(NfcReasonCode reason) {
        return new CardCheck(Result.REJECTED, reason, null, null);
    }

    public static CardCheck rejected(NfcReasonCode reason, int attemptsLeft, Instant lockedUntil) {
        return new CardCheck(Result.REJECTED, reason, attemptsLeft, lockedUntil);
    }

    public boolean isVerified() {
        return result == Result.VERIFIED;
    }

    /** A rejection that was counted, so it is worth telling the rest of the platform (AC-04.9). */
    public boolean isCountedFailure() {
        return result == Result.REJECTED && reasonCode.countsAsAttempt();
    }

    public boolean isLocked() {
        return lockedUntil != null;
    }
}
