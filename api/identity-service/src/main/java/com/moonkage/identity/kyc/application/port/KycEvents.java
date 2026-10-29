package com.moonkage.identity.kyc.application.port;

import com.moonkage.identity.kyc.domain.KycReasonCode;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.profile.MaskedIdNumber;
import com.moonkage.identity.shared.AccountId;
import java.time.Instant;

/**
 * Tells the rest of the platform how a card ended (Software Design 5.4): the web is pushed the result, and the
 * attempt is audited. Joins the caller's transaction, so an event goes out exactly when its outcome is saved.
 */
public interface KycEvents {

    void verified(AccountId owner, NfcSessionId session, MaskedIdNumber idNumber, Instant at);

    void failed(AccountId owner, NfcSessionId session, KycReasonCode reason, int attemptsLeft, Instant at);

    void locked(AccountId owner, NfcSessionId session, KycReasonCode reason, Instant lockedUntil, Instant at);
}
