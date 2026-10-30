package com.moonkage.identity.nfc.domain;

import java.time.Duration;

/**
 * The limits of KYC (Software Design 4.2; {@code nfc.*} in application.yml). A wrong value is a configuration error,
 * so it fails at start-up with {@link IllegalStateException}.
 *
 * @param sessionTtl how long a QR session stays usable (Q-31)
 * @param maxAttempts failed cards before KYC is locked (AC-04.9, Q-30)
 */
public record NfcRules(Duration sessionTtl, int maxAttempts, Duration lockoutDuration) {

    public NfcRules {
        if (!isPositive(sessionTtl)) {
            throw new IllegalStateException("nfc.session-ttl must be positive");
        }
        if (maxAttempts < 1) {
            throw new IllegalStateException("nfc.max-attempts must be at least 1");
        }
        if (!isPositive(lockoutDuration)) {
            throw new IllegalStateException("nfc.lockout-duration must be positive");
        }
    }

    private static boolean isPositive(Duration duration) {
        return duration != null && duration.isPositive();
    }
}
