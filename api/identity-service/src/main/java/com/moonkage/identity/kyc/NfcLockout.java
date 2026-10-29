package com.moonkage.identity.kyc;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.time.Duration;
import java.time.Instant;

/**
 * NFC attempt counter and lockout of one account (AC-04.9). Held only in memory by {@link NfcAttemptTracker}: it
 * matters only while a lockout runs (docs/services/identity/db-identify.md).
 *
 * <p>Always valid: the count is never negative, and a lockout restarts it, so a value with {@code lockedUntil} set has
 * no failed attempts.
 *
 * @param lockedUntil null = never locked; a past moment = a finished lockout
 */
record NfcLockout(int failedAttempts, Instant lockedUntil) {

    static final NfcLockout NONE = new NfcLockout(0, null);

    /** Invariants only the tracker can break: a violation is a bug (plan v2, 5.4). */
    NfcLockout {
        if (failedAttempts < 0) {
            throw new IllegalArgumentException("failed attempts < 0: " + failedAttempts);
        }
        if (lockedUntil != null && failedAttempts != 0) {
            throw new IllegalArgumentException("a lockout restarts the count, got " + failedAttempts);
        }
    }

    boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    /** Throws NFC_LOCKED with the minutes left, rounded up so the user never sees 0. */
    void ensureNotLocked(Instant now) {
        if (isLocked(now)) {
            throw new AppException(LegacyError.NFC_LOCKED, minutesLeft(now));
        }
    }

    /** Whether the lockout has run out: the value then holds nothing worth keeping. */
    boolean isFinished(Instant now) {
        return lockedUntil != null && !isLocked(now);
    }

    /** A finished lockout starts a fresh round of attempts. */
    NfcLockout clearFinished(Instant now) {
        return isFinished(now) ? NONE : this;
    }

    /**
     * Counts one failed attempt; the last allowed one locks until now + lockout duration and restarts the count. A
     * finished lockout is cleared first; while still locked no attempt can be counted (NFC_LOCKED).
     */
    NfcLockout recordFailure(NfcLockoutPolicy policy, Instant now) {
        ensureNotLocked(now);
        int attempts = clearFinished(now).failedAttempts + 1;
        return attempts < policy.maxAttempts()
                ? new NfcLockout(attempts, null)
                : new NfcLockout(0, now.plus(policy.lockoutDuration()));
    }

    int attemptsLeft(NfcLockoutPolicy policy) {
        return Math.max(0, policy.maxAttempts() - failedAttempts);
    }

    private long minutesLeft(Instant now) {
        return Math.max(1, Duration.between(now, lockedUntil).toMinutes() + 1);
    }
}
