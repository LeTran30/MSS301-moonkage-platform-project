package com.moonkage.identity.profile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;

/**
 * Fingerprint of an ID card number: lower-case hex HMAC-SHA256 with a secret pepper (NFR-03, D-07). The same number
 * gives the same fingerprint, which is how one card on two accounts is found (BR-23). Made by the system only.
 */
public record IdNumberHash(String value) {

    public static final int LENGTH = 64;

    private static final Pattern PATTERN = Pattern.compile("[0-9a-f]{" + LENGTH + "}");

    public IdNumberHash {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("an ID number hash is " + LENGTH + " lower-case hex digits");
        }
    }

    /** Constant time, so the time taken does not tell how many leading digits matched. */
    public boolean sameAs(IdNumberHash other) {
        return MessageDigest.isEqual(
                value.getBytes(StandardCharsets.US_ASCII), other.value.getBytes(StandardCharsets.US_ASCII));
    }
}
