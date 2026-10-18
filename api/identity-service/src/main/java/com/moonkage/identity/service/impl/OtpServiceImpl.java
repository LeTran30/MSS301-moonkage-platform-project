package com.moonkage.identity.service.impl;

import com.moonkage.identity.config.OtpProperties;
import com.moonkage.identity.enums.OtpPurpose;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.service.OtpService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Manages OTP lifecycle with security controls:
 * 1. Resend cooldown (prevent spamming sends).
 * 2. Active OTP reuse without resetting failed attempt counters (prevent infinite brute force).
 * 3. Hourly send quotas per email.
 * 4. Lockout on excessive failed verification attempts.
 *
 * <p>Every read-modify-write goes through {@link Map#compute}, so parallel requests cannot share one
 * counter value. The counters live apart from the code and are kept for emails without an account too,
 * so throttling answers the same whether the email exists or not (FR-02).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final Duration SEND_WINDOW = Duration.ofHours(1);

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
                    && (sendWindowStart == null || !now.isBefore(sendWindowStart.plus(SEND_WINDOW)));
        }
    }

    private enum Outcome {
        MATCH,
        MISMATCH,
        LOCKED
    }

    /** One code and one set of counters per purpose and email (Q-05). */
    record OtpKey(OtpPurpose purpose, String email) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    final Map<OtpKey, OtpEntry> storageMap = new ConcurrentHashMap<>();

    private final OtpProperties properties;

    @Override
    public String issueOtp(OtpPurpose purpose, String email) {
        requireEmail(email);
        Instant now = Instant.now();
        return storageMap
                .compute(new OtpKey(purpose, email), (k, current) -> {
                    OtpEntry entry = reserveSend(current, now);
                    return entry.hasActiveOtp(now)
                            ? entry
                            : entry.withOtp(generateOtp(), now.plus(properties.getExpiration()));
                })
                .otp();
    }

    @Override
    public void throttleSend(OtpPurpose purpose, String email) {
        requireEmail(email);
        Instant now = Instant.now();
        storageMap.compute(new OtpKey(purpose, email), (k, current) -> reserveSend(current, now));
    }

    @Override
    public boolean verifyOtp(OtpPurpose purpose, String email, String otpVerify) {
        if (email == null || email.isBlank()) {
            return false;
        }
        Instant now = Instant.now();
        AtomicReference<Outcome> outcome = new AtomicReference<>();
        OtpEntry result = storageMap.compute(new OtpKey(purpose, email), (k, current) -> {
            OtpEntry entry = current == null ? OtpEntry.EMPTY : current.unlockIfExpired(now);
            if (entry.isLocked(now)) {
                outcome.set(Outcome.LOCKED);
                return entry;
            }
            if (otpVerify != null && entry.hasActiveOtp(now) && matches(entry.otp(), otpVerify)) {
                outcome.set(Outcome.MATCH);
                // consumed here, so two parallel requests cannot both redeem the same code
                return entry.withOtp(null, null).withFailure(0, null);
            }
            // unknown email, expired or wrong code all count, so a lockout cannot tell them apart
            int attempts = entry.attempts() + 1;
            boolean lock = attempts >= properties.getMaxAttempts();
            outcome.set(lock ? Outcome.LOCKED : Outcome.MISMATCH);
            return entry.withFailure(attempts, lock ? now.plus(properties.getLockoutDuration()) : null);
        });
        return switch (outcome.get()) {
            case MATCH -> true;
            case MISMATCH -> false;
            case LOCKED -> throw lockedException(result, now);
        };
    }

    /** Drops the pending code but keeps the counters, so a failed send cannot lift a lockout or quota. */
    @Override
    public void clearOtp(OtpPurpose purpose, String email) {
        if (email != null) {
            storageMap.computeIfPresent(new OtpKey(purpose, email), (k, e) -> e.withOtp(null, null));
        }
    }

    @Scheduled(fixedDelayString = "${otp.cleanup-interval}")
    void purgeStaleEntries() {
        Instant now = Instant.now();
        // removeIf goes through the map's own conditional remove, so it never drops a concurrent update
        storageMap.entrySet().removeIf(e -> e.getValue().isStale(now, properties.getResendCooldown()));
    }

    /** Applies lockout, hourly quota and cooldown, then records the send. Throws without changing state. */
    private OtpEntry reserveSend(OtpEntry current, Instant now) {
        OtpEntry entry = current == null ? OtpEntry.EMPTY : current.unlockIfExpired(now);
        if (entry.isLocked(now)) {
            throw lockedException(entry, now);
        }
        boolean inWindow = entry.sendWindowStart() != null
                && now.isBefore(entry.sendWindowStart().plus(SEND_WINDOW));
        if (inWindow && entry.sendCount() >= properties.getMaxResendPerHour()) {
            throw new AppException(ErrorCode.OTP_SEND_LIMIT_EXCEEDED);
        }
        if (entry.lastSentAt() != null && now.isBefore(entry.lastSentAt().plus(properties.getResendCooldown()))) {
            long remainingSeconds = Math.max(
                    1,
                    Duration.between(now, entry.lastSentAt().plus(properties.getResendCooldown()))
                            .toSeconds());
            throw new AppException(ErrorCode.OTP_TOO_FREQUENT, remainingSeconds);
        }
        return inWindow
                ? entry.withSend(now, entry.sendCount() + 1, entry.sendWindowStart())
                : entry.withSend(now, 1, now);
    }

    private AppException lockedException(OtpEntry entry, Instant now) {
        long remainingMinutes =
                Math.max(1, Duration.between(now, entry.lockedUntil()).toMinutes() + 1);
        return new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, properties.getMaxAttempts(), remainingMinutes);
    }

    private String generateOtp() {
        return String.valueOf(properties.getMin() + RANDOM.nextInt(properties.getRange()));
    }

    private static boolean matches(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    private static void requireEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }
}
