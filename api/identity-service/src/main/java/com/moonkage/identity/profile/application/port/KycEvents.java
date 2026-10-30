package com.moonkage.identity.profile.application.port;

import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.MaskedIdNumber;
import java.time.Instant;

/**
 * Tells the rest of the platform how a card ended (Software Design 5.4): the web is pushed the result, and the
 * attempt is audited. Joins the caller's transaction, so an event goes out exactly when its outcome is saved.
 */
public interface KycEvents {

    void verified(AccountId owner, NfcSessionId session, MaskedIdNumber idNumber, Instant at);

    void failed(AccountId owner, NfcSessionId session, NfcReasonCode reason, int attemptsLeft, Instant at);

    void locked(AccountId owner, NfcSessionId session, NfcReasonCode reason, Instant lockedUntil, Instant at);
}
