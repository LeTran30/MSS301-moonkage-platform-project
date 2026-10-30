package com.moonkage.identity.nfc;

import com.moonkage.identity.shared.AccountId;

/**
 * Reading an ID card by NFC (FR-04), as {@code otp} is sending a code: the QR session, the card checks and the failed
 * attempt lockout. What a card proves is the caller's business. Nothing here is stored in the database.
 */
public interface NfcApi {

    /** AC-04.1: a new QR; only the newest one of an account works. Throws LOCKED with the minutes left. */
    NfcSessionView open(AccountId owner);

    /** Throws SESSION_EXPIRED (unknown or expired) or SESSION_NOT_OWNED. */
    NfcSessionView find(NfcSessionId id, AccountId caller);

    /** Whether too many failed cards locked the account out for now (AC-04.9). */
    boolean isLocked(AccountId owner);

    /**
     * AC-04.2 - AC-04.9: checks the card in Software Design 4.2 order (session, lockout, seal, format, expiry), then
     * asks {@code verdict}. A rejected card is an answer, never an error; a failure counts and may lock. The session is
     * held while the card is checked and released whatever happens, an exception of {@code verdict} included.
     */
    CardCheck check(NfcSessionId id, AccountId caller, SubmittedCard card, CardVerdict verdict);
}
