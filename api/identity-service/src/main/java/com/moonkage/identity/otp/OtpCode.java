package com.moonkage.identity.otp;

import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.random.RandomGenerator;

/** A one-time code: six digits, never starting with 0. Never logged. */
public record OtpCode(String value) {

    private static final int LOWEST = 100_000;
    private static final int HOW_MANY = 900_000;

    public OtpCode {
        Text.assertPresent(value, "otp");
    }

    /**
     * What the person typed, kept as typed: a code in any other shape is simply a wrong guess, which counts toward
     * the lockout. Throws ValueRejected REQUIRED when blank.
     */
    public static OtpCode parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw ValueRejected.required();
        }
        return new OtpCode(raw);
    }

    /** A new code; {@code random} must be a SecureRandom outside tests. */
    public static OtpCode random(RandomGenerator random) {
        return new OtpCode(String.valueOf(LOWEST + random.nextInt(HOW_MANY)));
    }

    /** Constant time, so the comparison does not leak how many leading digits were right. */
    public boolean sameAs(OtpCode other) {
        return MessageDigest.isEqual(
                value.getBytes(StandardCharsets.UTF_8), other.value.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String toString() {
        return Text.HIDDEN;
    }
}
