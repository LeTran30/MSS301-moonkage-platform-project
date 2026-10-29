package com.moonkage.identity.profile;

import java.util.regex.Pattern;

/** An ID card number with only its last four digits visible, e.g. {@code ********1234} (AC-04.12). */
public record MaskedIdNumber(String value) {

    public static final int LENGTH = 12;

    private static final int VISIBLE_DIGITS = 4;
    private static final String MASK = "*";
    private static final Pattern PATTERN =
            Pattern.compile("\\*{" + (LENGTH - VISIBLE_DIGITS) + "}\\d{" + VISIBLE_DIGITS + "}");

    public MaskedIdNumber {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("a masked ID number is 8 '*' and 4 digits");
        }
    }

    /** {@code digits}: the full 12-digit number, already checked by its owner. */
    public static MaskedIdNumber of(String digits) {
        int hidden = digits.length() - VISIBLE_DIGITS;
        return new MaskedIdNumber(MASK.repeat(hidden) + digits.substring(hidden));
    }
}
