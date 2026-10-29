package com.moonkage.identity.otp.domain;

import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.shared.error.AppException;
import java.time.Duration;
import java.time.Instant;
import java.util.function.Supplier;

/**
 * The pending code and the counters of one {@link OtpKey}. {@code code} is null when none is pending; the counters
 * outlive the code. Immutable: every change returns a new entry, or throws and changes nothing.
 */
public record OtpEntry(
        OtpCode code,
        Instant expiresAt,
        int attempts,
        Instant lastSentAt,
        int sendCount,
        Instant sendWindowStart,
        Instant lockedUntil) {

    /** A key nothing was recorded for yet. */
    public static final OtpEntry EMPTY = new OtpEntry(null, null, 0, null, 0, null, null);

    /** What one guess did. */
    public enum Outcome {
        MATCH,
        MISMATCH,
        LOCKED
    }

    /** The entry after a guess, and what the guess did. */
    public record Guess(OtpEntry entry, Outcome outcome) {}

    /**
     * Applies lockout, send quota and cooldown, then counts the send. Throws MAX_ATTEMPTS_EXCEEDED,
     * SEND_LIMIT_EXCEEDED or TOO_FREQUENT.
     */
    public OtpEntry reserveSend(OtpRules rules, Instant now) {
        OtpEntry entry = unlockIfExpired(now);
        if (entry.isLocked(now)) {
            throw entry.lockedOut(rules, now);
        }
        boolean inWindow = entry.isInSendWindow(now);
        if (inWindow && entry.sendCount >= rules.maxSendsPerWindow()) {
            throw new AppException(OtpError.SEND_LIMIT_EXCEEDED);
        }
        if (entry.lastSentAt != null) {
            Instant cooldownEnd = entry.lastSentAt.plus(rules.resendCooldown());
            if (now.isBefore(cooldownEnd)) {
                long secondsLeft =
                        Math.max(1, Duration.between(now, cooldownEnd).toSeconds());
                throw new AppException(OtpError.TOO_FREQUENT, secondsLeft);
            }
        }
        return inWindow ? entry.withSend(now, entry.sendCount + 1, entry.sendWindowStart) : entry.withSend(now, 1, now);
    }

    /** Keeps a code that is still valid; otherwise takes a new one, valid for the code lifetime. */
    public OtpEntry withCodeIfNone(Supplier<OtpCode> newCode, OtpRules rules, Instant now) {
        return hasActiveCode(now)
                ? this
                : new OtpEntry(
                        newCode.get(),
                        now.plus(rules.codeLifetime()),
                        attempts,
                        lastSentAt,
                        sendCount,
                        sendWindowStart,
                        lockedUntil);
    }

    /**
     * Compares a guess. A right code is consumed at once, so two parallel requests cannot both redeem it. A wrong,
     * expired or missing code counts alike, so a lockout cannot tell them apart.
     */
    public Guess guess(OtpCode guess, OtpRules rules, Instant now) {
        OtpEntry entry = unlockIfExpired(now);
        if (entry.isLocked(now)) {
            return new Guess(entry, Outcome.LOCKED);
        }
        if (entry.hasActiveCode(now) && entry.code.sameAs(guess)) {
            return new Guess(entry.withoutCode().withFailures(0, null), Outcome.MATCH);
        }
        int failures = entry.attempts + 1;
        boolean lock = failures >= rules.maxAttempts();
        return new Guess(
                entry.withFailures(failures, lock ? now.plus(rules.lockoutDuration()) : null),
                lock ? Outcome.LOCKED : Outcome.MISMATCH);
    }

    /** Drops the pending code; the counters stay. */
    public OtpEntry withoutCode() {
        return new OtpEntry(null, null, attempts, lastSentAt, sendCount, sendWindowStart, lockedUntil);
    }

    /** MAX_ATTEMPTS_EXCEEDED with the allowed guesses and the minutes left, rounded up. */
    public AppException lockedOut(OtpRules rules, Instant now) {
        long minutesLeft = Math.max(1, Duration.between(now, lockedUntil).toMinutes() + 1);
        return new AppException(OtpError.MAX_ATTEMPTS_EXCEEDED, rules.maxAttempts(), minutesLeft);
    }

    public boolean hasActiveCode(Instant now) {
        return code != null && now.isBefore(expiresAt);
    }

    public boolean isLocked(Instant now) {
        return lockedUntil != null && now.isBefore(lockedUntil);
    }

    /** The current send window started at sendWindowStart and has not ended yet. */
    private boolean isInSendWindow(Instant now) {
        return sendWindowStart != null && now.isBefore(sendWindowStart.plus(OtpRules.SEND_WINDOW));
    }

    /** A finished lockout starts a fresh round of attempts. */
    private OtpEntry unlockIfExpired(Instant now) {
        return lockedUntil != null && !isLocked(now) ? withFailures(0, null) : this;
    }

    private OtpEntry withFailures(int newAttempts, Instant newLockedUntil) {
        return new OtpEntry(code, expiresAt, newAttempts, lastSentAt, sendCount, sendWindowStart, newLockedUntil);
    }

    private OtpEntry withSend(Instant sentAt, int newSendCount, Instant newWindowStart) {
        return new OtpEntry(code, expiresAt, attempts, sentAt, newSendCount, newWindowStart, lockedUntil);
    }
}
