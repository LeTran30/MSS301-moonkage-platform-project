package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.text.Diacritics;
import java.io.Serializable;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Full name of the household head / sole proprietor as written on the business licence, without diacritics (AC-26.1,
 * A-15), e.g. "PHAM VAN BANH". Stored upper case with single spaces; a name typed with diacritics is refused so the
 * owner sees the error at the field (FR-26).
 */
public record RepresentativeName(String value) implements Serializable {

    /** Column representative_name. */
    public static final int MAX_LENGTH = 100;

    private static final Pattern FORMAT = Pattern.compile("^[A-Z]+( [A-Z]+)*$");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public RepresentativeName {
        if (value == null) {
            throw new AppException(ErrorCode.REPRESENTATIVE_NAME_INVALID, MAX_LENGTH);
        }
        value = normalize(value);
        if (value.length() > MAX_LENGTH || !FORMAT.matcher(value).matches()) {
            throw new AppException(ErrorCode.REPRESENTATIVE_NAME_INVALID, MAX_LENGTH);
        }
    }

    public static RepresentativeName of(String value) {
        return new RepresentativeName(value);
    }

    /**
     * A-15: the name on the owner's ID card (upper case, may carry diacritics) is the same name once both are
     * normalized and stripped of diacritics, Đ included. No fuzzy matching; the ID number is what really decides.
     */
    public boolean matches(String nameOnCard) {
        return nameOnCard != null && value.equals(Diacritics.strip(normalize(nameOnCard)));
    }

    @Override
    public String toString() {
        return value;
    }

    /** Unicode NFC, trimmed, inner spaces collapsed, upper case (A-15). */
    private static String normalize(String name) {
        String composed = Normalizer.normalize(name, Normalizer.Form.NFC).trim();
        return WHITESPACE.matcher(composed).replaceAll(" ").toUpperCase(Locale.ROOT);
    }
}
