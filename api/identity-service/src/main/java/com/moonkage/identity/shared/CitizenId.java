package com.moonkage.identity.shared;

import com.moonkage.identity.shared.value.ValueRejected;
import java.util.regex.Pattern;

/**
 * The 12-digit number of a Vietnamese chip ID card (CCCD). Input only: it lives for one request, is hashed and
 * masked, and is never stored or logged (NFR-03).
 */
public record CitizenId(String value) {

    public static final int DIGITS = 12;

    private static final Pattern PATTERN = Pattern.compile("\\d{" + DIGITS + "}");
    private static final Pattern NON_DIGIT = Pattern.compile("\\D");

    public CitizenId {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("a citizen id is " + DIGITS + " digits");
        }
    }

    /** As read from a card: exactly 12 digits, nothing else. BAD_FORMAT otherwise. */
    public static CitizenId parse(String raw) {
        if (raw == null || !PATTERN.matcher(raw).matches()) {
            throw ValueRejected.badFormat();
        }
        return new CitizenId(raw);
    }

    /** As a person typed it ("079 123-456 789"): every non-digit is dropped first (BR-27). */
    public static CitizenId parseDeclared(String raw) {
        return parse(raw == null ? null : NON_DIGIT.matcher(raw).replaceAll(""));
    }

    public MaskedIdNumber masked() {
        return MaskedIdNumber.of(value);
    }

    @Override
    public String toString() {
        return masked().value();
    }
}
