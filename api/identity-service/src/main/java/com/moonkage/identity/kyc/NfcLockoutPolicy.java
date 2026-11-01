package com.moonkage.identity.kyc;

import java.time.Duration;

/**
 * How many failed NFC card attempts lock verification, and for how long (AC-04.9; nfc.* in application.yml).
 *
 * <p>A wrong value is a configuration error, not user input, so it fails with {@link IllegalStateException}.
 */
record NfcLockoutPolicy(int maxAttempts, Duration lockoutDuration) {

    NfcLockoutPolicy {
        if (maxAttempts < 1) {
            throw new IllegalStateException("nfc.max-attempts must be at least 1");
        }
        if (lockoutDuration == null || lockoutDuration.isNegative() || lockoutDuration.isZero()) {
            throw new IllegalStateException("nfc.lockout-duration must be positive");
        }
    }
}
