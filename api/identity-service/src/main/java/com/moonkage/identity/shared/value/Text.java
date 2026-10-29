package com.moonkage.identity.shared.value;

/**
 * The text rules value objects share in {@code parse} and in their constructor (plan v2, 5.3). Records cannot extend
 * a base class, so these are static functions.
 */
public final class Text {

    private Text() {}

    /** Trimmed; missing or blank is {@code REQUIRED}. */
    public static String required(String raw) {
        if (raw == null || raw.isBlank()) {
            throw ValueRejected.required();
        }
        return raw.trim();
    }

    /** {@link #required} and at most {@code maxLength} characters, else {@code TOO_LONG}. */
    public static String bounded(String raw, int maxLength) {
        String value = required(raw);
        if (value.length() > maxLength) {
            throw ValueRejected.tooLong(maxLength);
        }
        return value;
    }

    /**
     * Structural invariant for a constructor that rebuilds a value from a trusted source: a blank value there is a
     * bug, not bad input.
     *
     * @throws IllegalArgumentException when {@code value} is null or blank
     */
    public static String assertPresent(String value, String what) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(what + " is blank");
        }
        return value;
    }
}
