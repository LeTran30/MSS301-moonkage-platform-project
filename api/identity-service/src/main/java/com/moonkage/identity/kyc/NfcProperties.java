package com.moonkage.identity.kyc;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * FR-04 limits ({@code nfc.*} in application.yml; demo values of Software Design 4.2) and the three secrets that
 * belong to the same group ({@code nfc.transport-private-key}, {@code nfc.pii-key}, {@code nfc.id-hash-pepper}).
 *
 * <p>The three secrets used to be read one by one with {@code @Value}; they are part of the {@code nfc.*} group
 * like the limits are, so they live here too. The names and the defaults do not change: a key that the yml does not
 * set stays empty, and the class that uses it refuses to work with an empty one.
 *
 * <p>The defaults here only apply when a key is missing from the yml, e.g. in unit tests.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "nfc")
class NfcProperties {

    /** How long a QR session stays usable (Q-31). */
    private Duration sessionTtl = Duration.ofMinutes(5);

    /** Failed card attempts before verification is locked (AC-04.9, Q-30). */
    private int maxAttempts = 5;

    private Duration lockoutDuration = Duration.ofMinutes(15);

    /**
     * The PKCS#8 private key that opens what the app locked (D-17); identity-service only, and versioned by the
     * name of the environment variable.
     */
    private String transportPrivateKey;

    /** The 32 random bytes, Base64, that lock the ID number and the date of birth (D-17). */
    private String piiKey;

    /** The secret that fingerprints an ID number (NFR-03, D-07); identity-service only. */
    private String idHashPepper;

    /** The two limits above, checked. */
    NfcLockoutPolicy lockoutPolicy() {
        return new NfcLockoutPolicy(maxAttempts, lockoutDuration);
    }
}
