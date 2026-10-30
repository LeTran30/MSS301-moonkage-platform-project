package com.moonkage.identity.nfc.domain;

import com.moonkage.identity.nfc.NfcError;
import com.moonkage.identity.shared.error.AppException;
import java.time.Duration;
import java.time.Instant;

/**
 * Failed card attempts and the lockout of one account (AC-04.9). Held in memory only: it matters only while a lockout
 * runs (db-identify.md).
 *
 * <p>Always valid: the count is never negative, and a lockout restarts it, so a value with {@code lockedUntil} set has
 * no failed attempts.
 *
 * @param lockedUntil null = never locked; a past moment = a finished lockout
 */
public record NfcLockout(int failedAttempts, Instant lockedUntil) {

    public static final NfcLockout NONE = new NfcLockout(0, null);

    public NfcLockout {
        if (failedAttempts < 0) {
            throw new IllegalArgumentException("failed attempts < 0: " + failedAttempts);
        }
        if (lockedUntil != null && failedAttempts != 0) {
            throw new IllegalArgumentException("a lockout restarts the count, got " + failedAttempts);
        }
    }

    public boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    /** Throws LOCKED with the minutes left, rounded up so the user never sees 0. */
    public void ensureNotLocked(Instant now) {
        if (isLocked(now)) {
            throw new AppException(NfcError.LOCKED, minutesLeft(now));
        }
    }

    /** Whether the lockout has run out: the value then holds nothing worth keeping. */
    public boolean isFinished(Instant now) {
        return lockedUntil != null && !isLocked(now);
    }

    /**
     * Counts one failed attempt; the last allowed one locks until now + lockout duration and restarts the count. A
     * finished lockout starts a fresh round. While locked nothing is counted: a card checked in parallel with the one
     * that locked changes nothing.
     */
    public NfcLockout recordFailure(NfcRules rules, Instant now) {
        if (isLocked(now)) {
            return this;
        }
        int attempts = (isFinished(now) ? 0 : failedAttempts) + 1;
        return attempts < rules.maxAttempts()
                ? new NfcLockout(attempts, null)
                : new NfcLockout(0, now.plus(rules.lockoutDuration()));
    }

    public int attemptsLeft(NfcRules rules) {
        return Math.max(0, rules.maxAttempts() - failedAttempts);
    }

    private long minutesLeft(Instant now) {
        return Math.max(1, Duration.between(now, lockedUntil).toMinutes() + 1);
    }
}
