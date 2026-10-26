package com.moonkage.identity.account;

import java.time.Duration;
import java.time.Instant;

/**
 * NFC attempt counter and lockout of an account (AC-04.9). Stored on the account row so the row lock serialises
 * parallel card submits; the policy (max attempts, lockout duration) belongs to kyc and comes in as arguments.
 *
 * @param lockedUntil null = not locked
 */
public record NfcLockout(int failedAttempts, Instant lockedUntil) {

    public static final NfcLockout NONE = new NfcLockout(0, null);

    public boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    /** A finished lockout starts a fresh round of attempts. */
    public NfcLockout clearFinished(Instant now) {
        return lockedUntil != null && !isLocked(now) ? NONE : this;
    }

    /** Counts one failed attempt; the last allowed one locks until now + lockoutDuration and restarts the count. */
    public NfcLockout recordFailure(int maxAttempts, Duration lockoutDuration, Instant now) {
        int attempts = failedAttempts + 1;
        return attempts < maxAttempts
                ? new NfcLockout(attempts, lockedUntil)
                : new NfcLockout(0, now.plus(lockoutDuration));
    }

    public int attemptsLeft(int maxAttempts) {
        return Math.max(0, maxAttempts - failedAttempts);
    }
}
