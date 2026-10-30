package com.moonkage.identity.nfc.application.port;

import com.moonkage.identity.nfc.domain.NfcLockout;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.shared.AccountId;
import java.time.Instant;

/** Failed cards and lockouts per account (AC-04.9), kept in memory: they matter only while a lockout runs. */
public interface NfcAttemptStore {

    NfcLockout lockoutOf(AccountId id);

    /** Counts one failed card atomically, so two parallel failures are both counted; returns the new state. */
    NfcLockout recordFailure(AccountId id, NfcRules rules, Instant now);

    /** A verified card: the account starts clean. */
    void clear(AccountId id);

    /** Drops lockouts that have run out. */
    void removeFinished(Instant now);
}
