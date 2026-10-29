package com.moonkage.identity.otp;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * One-time codes of register and password reset, kept in memory per (purpose, email). Flow and invariants:
 * docs/services/identity/classes/OtpServiceImpl.md. Four limits protect them:
 *
 * <ol>
 *   <li>a cooldown between two sends;
 *   <li>at most {@code otp.max-resend-per-hour} sends per hour;
 *   <li>a resend inside the code's lifetime reuses the code, so asking again never resets the wrong-guess counter;
 *   <li>too many wrong guesses lock the email for {@code otp.lockout-duration}.
 * </ol>
 *
 * <p>Every read-modify-write goes through {@link Map#compute}, so parallel requests cannot share one counter value.
 * The counters are kept for emails without an account too, so the answer is the same whether the email exists or
 * not (FR-02).
 */
@Service
@RequiredArgsConstructor
class OtpServiceImpl implements OtpService {

    private static final Duration SEND_WINDOW = Duration.ofHours(1);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpProperties properties;

    final Map<OtpKey, OtpEntry> otpEntries = new ConcurrentHashMap<>();

    @Override
    public String issueOtp(OtpPurpose purpose, Email email) {
        Objects.requireNonNull(email, "email must not be null");
        Instant now = Instant.now();
        OtpEntry issued = otpEntries.compute(new OtpKey(purpose, email), (key, current) -> {
            OtpEntry entry = reserveSend(current, now);
            return entry.hasActiveOtp(now) ? entry : entry.withOtp(generateOtp(), now.plus(properties.getExpiration()));
        });
        return issued.otp();
    }

    @Override
    public void throttleSend(OtpPurpose purpose, Email email) {
        Objects.requireNonNull(email, "email must not be null");
        Instant now = Instant.now();
        otpEntries.compute(new OtpKey(purpose, email), (key, current) -> reserveSend(current, now));
    }

    @Override
    public void verifyOtp(OtpPurpose purpose, Email email, String otp) {
        if (email == null) {
            throw new AppException(LegacyError.OTP_INVALID_OR_EXPIRED);
        }
        Instant now = Instant.now();
        AtomicReference<Outcome> outcome = new AtomicReference<>();
        OtpEntry result = otpEntries.compute(
                new OtpKey(purpose, email), (key, current) -> checkGuess(current, otp, now, outcome));

        if (outcome.get() == Outcome.LOCKED) {
            throw toLockedException(result, now);
        }
        if (outcome.get() == Outcome.MISMATCH) {
            throw new AppException(LegacyError.OTP_INVALID_OR_EXPIRED);
        }
    }

    /** Drops the pending code but keeps the counters, so a failed send cannot lift a lockout or quota. */
    @Override
    public void clearOtp(OtpPurpose purpose, Email email) {
        if (email != null) {
            otpEntries.computeIfPresent(new OtpKey(purpose, email), (key, entry) -> entry.withOtp(null, null));
        }
    }

    @Scheduled(fixedDelayString = "${otp.cleanup-interval}")
    void purgeStaleEntries() {
        Instant now = Instant.now();
        // removeIf goes through the map's own conditional remove, so it never drops a concurrent update
        otpEntries.entrySet().removeIf(e -> e.getValue().isStale(now, properties.getResendCooldown()));
    }

    /** Applies lockout, hourly quota and cooldown, then records the send. Throws without changing state. */
    private OtpEntry reserveSend(OtpEntry current, Instant now) {
        OtpEntry entry = current == null ? OtpEntry.EMPTY : current.unlockIfExpired(now);
        if (entry.isLocked(now)) {
            throw toLockedException(entry, now);
        }
        boolean inWindow = entry.isInSendWindow(now);
        if (inWindow && entry.sendCount() >= properties.getMaxResendPerHour()) {
            throw new AppException(LegacyError.OTP_SEND_LIMIT_EXCEEDED);
        }
        Instant cooldownEnd =
                entry.lastSentAt() == null ? null : entry.lastSentAt().plus(properties.getResendCooldown());
        if (cooldownEnd != null && now.isBefore(cooldownEnd)) {
            long remainingSeconds =
                    Math.max(1, Duration.between(now, cooldownEnd).toSeconds());
            throw new AppException(LegacyError.OTP_TOO_FREQUENT, remainingSeconds);
        }
        return inWindow
                ? entry.withSend(now, entry.sendCount() + 1, entry.sendWindowStart())
                : entry.withSend(now, 1, now);
    }

    private String generateOtp() {
        return String.valueOf(properties.getMin() + RANDOM.nextInt(properties.getRange()));
    }

    /**
     * Runs inside {@link Map#compute}: compares the guess and returns the new entry; {@code outcome} tells the caller
     * what happened. A right code is consumed at once, so two parallel requests cannot both redeem it.
     */
    private OtpEntry checkGuess(OtpEntry current, String otp, Instant now, AtomicReference<Outcome> outcome) {
        OtpEntry entry = current == null ? OtpEntry.EMPTY : current.unlockIfExpired(now);
        if (entry.isLocked(now)) {
            outcome.set(Outcome.LOCKED);
            return entry;
        }
        if (otp != null && entry.hasActiveOtp(now) && matches(entry.otp(), otp)) {
            outcome.set(Outcome.MATCH);
            return entry.withOtp(null, null).withFailure(0, null);
        }
        // unknown email, expired or wrong code all count, so a lockout cannot tell them apart
        int attempts = entry.attempts() + 1;
        boolean lock = attempts >= properties.getMaxAttempts();
        outcome.set(lock ? Outcome.LOCKED : Outcome.MISMATCH);
        return entry.withFailure(attempts, lock ? now.plus(properties.getLockoutDuration()) : null);
    }

    /** Constant time, so the comparison does not leak how many leading digits were right. */
    private static boolean matches(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    private AppException toLockedException(OtpEntry entry, Instant now) {
        long remainingMinutes =
                Math.max(1, Duration.between(now, entry.lockedUntil()).toMinutes() + 1);
        return new AppException(LegacyError.OTP_MAX_ATTEMPTS_EXCEEDED, properties.getMaxAttempts(), remainingMinutes);
    }

    private enum Outcome {
        MATCH,
        MISMATCH,
        LOCKED
    }

    /** One code and one set of counters per purpose and email (Q-05). */
    record OtpKey(OtpPurpose purpose, Email email) {}

    /** {@code otp} is null when no code is pending; the counters outlive the code. */
    record OtpEntry(
            String otp,
            Instant expiresAt,
            int attempts,
            Instant lastSentAt,
            int sendCount,
            Instant sendWindowStart,
            Instant lockedUntil) {

        static final OtpEntry EMPTY = new OtpEntry(null, null, 0, null, 0, null, null);

        boolean hasActiveOtp(Instant now) {
            return otp != null && now.isBefore(expiresAt);
        }

        boolean isLocked(Instant now) {
            return lockedUntil != null && now.isBefore(lockedUntil);
        }

        /** The current hour of sends started at sendWindowStart and has not ended yet. */
        boolean isInSendWindow(Instant now) {
            return sendWindowStart != null && now.isBefore(sendWindowStart.plus(SEND_WINDOW));
        }

        /** A finished lockout starts a fresh round of attempts. */
        OtpEntry unlockIfExpired(Instant now) {
            return lockedUntil != null && !isLocked(now)
                    ? new OtpEntry(otp, expiresAt, 0, lastSentAt, sendCount, sendWindowStart, null)
                    : this;
        }

        OtpEntry withOtp(String newOtp, Instant newExpiresAt) {
            return new OtpEntry(newOtp, newExpiresAt, attempts, lastSentAt, sendCount, sendWindowStart, lockedUntil);
        }

        OtpEntry withFailure(int newAttempts, Instant newLockedUntil) {
            return new OtpEntry(otp, expiresAt, newAttempts, lastSentAt, sendCount, sendWindowStart, newLockedUntil);
        }

        OtpEntry withSend(Instant sentAt, int newSendCount, Instant newWindowStart) {
            return new OtpEntry(otp, expiresAt, attempts, sentAt, newSendCount, newWindowStart, lockedUntil);
        }

        /** Nothing left to enforce: no pending code, no lockout, cooldown and send window over. */
        boolean isStale(Instant now, Duration cooldown) {
            return !hasActiveOtp(now)
                    && !isLocked(now)
                    && (lastSentAt == null || !now.isBefore(lastSentAt.plus(cooldown)))
                    && !isInSendWindow(now);
        }
    }
}
