package com.moonkage.identity.kyc;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Failed NFC card attempts and lockouts per account (AC-04.9), in memory like the sessions: they matter only while a
 * lockout runs (docs/services/identity/db-identify.md). A restart forgets them, as it forgets OTPs.
 *
 * <p>Each change goes through {@link Map#compute}, so two parallel failures of one account are both counted.
 */
@Component
@RequiredArgsConstructor
class NfcAttemptTracker {

    private final NfcProperties nfcProperties;

    private final Map<String, NfcLockout> lockouts = new ConcurrentHashMap<>();

    NfcLockout lockoutOf(String accountId) {
        return lockouts.getOrDefault(accountId, NfcLockout.NONE);
    }

    /** Throws NFC_LOCKED with the minutes left. */
    void ensureNotLocked(String accountId, Instant now) {
        lockoutOf(accountId).ensureNotLocked(now);
    }

    /** Counts one failed card; the last allowed one locks. Throws NFC_LOCKED while a lockout runs. */
    NfcLockout recordFailure(String accountId, Instant now) {
        NfcLockoutPolicy policy = nfcProperties.lockoutPolicy();
        return lockouts.compute(
                accountId, (id, lockout) -> (lockout == null ? NfcLockout.NONE : lockout).recordFailure(policy, now));
    }

    /** A verified card: the account starts clean. */
    void clear(String accountId) {
        lockouts.remove(accountId);
    }

    /** Drops lockouts that have run out, so the map holds only accounts with something to remember. */
    void purgeFinished(Instant now) {
        lockouts.values().removeIf(lockout -> lockout.isFinished(now));
    }
}
