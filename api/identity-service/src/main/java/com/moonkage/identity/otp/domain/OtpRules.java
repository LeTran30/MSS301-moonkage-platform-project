package com.moonkage.identity.otp.domain;

import java.time.Duration;
import java.util.stream.Stream;

/**
 * The limits that protect the codes (values from {@code otp.*} in application.yml, documented in docs/auth.md):
 *
 * <ol>
 *   <li>a cooldown between two sends;
 *   <li>at most {@code maxSendsPerWindow} sends per {@link #SEND_WINDOW};
 *   <li>a resend inside the code's lifetime gives the same code, so asking again never resets the wrong-guess counter;
 *   <li>{@code maxAttempts} wrong guesses lock the purpose and email for {@code lockoutDuration}.
 * </ol>
 */
public record OtpRules(
        Duration codeLifetime,
        int maxAttempts,
        Duration resendCooldown,
        int maxSendsPerWindow,
        Duration lockoutDuration) {

    /** The quota of {@code maxSendsPerWindow} counts sends of the last hour ({@code otp.max-resend-per-hour}). */
    public static final Duration SEND_WINDOW = Duration.ofHours(1);

    public OtpRules {
        requirePositive(codeLifetime, "codeLifetime");
        requirePositive(resendCooldown, "resendCooldown");
        requirePositive(lockoutDuration, "lockoutDuration");
        if (maxAttempts < 1 || maxSendsPerWindow < 1) {
            throw new IllegalArgumentException("maxAttempts and maxSendsPerWindow must be at least 1");
        }
    }

    /**
     * How long an entry must be kept after its last change: until its code, lockout, cooldown and send window are all
     * over. Then it holds nothing left to enforce.
     */
    public Duration retention() {
        return Stream.of(codeLifetime, resendCooldown, lockoutDuration, SEND_WINDOW)
                .max(Duration::compareTo)
                .orElseThrow();
    }

    private static void requirePositive(Duration duration, String name) {
        if (duration == null || duration.isNegative() || duration.isZero()) {
            throw new IllegalArgumentException(name + " must be positive");
        }
    }
}
