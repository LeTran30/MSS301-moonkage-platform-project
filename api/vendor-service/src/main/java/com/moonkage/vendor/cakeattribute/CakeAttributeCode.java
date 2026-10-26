package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.regex.Pattern;

/**
 * The stable name of a crust or filling, e.g. "dau-xanh": lower case, no diacritics, words joined by hyphens. Built
 * from the label once and never changed (AC-54.1), so products, order profiles, events and filters refer to it.
 */
public record CakeAttributeCode(String value) {

    /** cake_attributes.code is varchar(60). */
    public static final int MAX_LENGTH = 60;

    private static final Pattern FORMAT = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");
    private static final Pattern NOT_LETTER_OR_DIGIT = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGE_HYPHENS = Pattern.compile("^-+|-+$");

    public CakeAttributeCode {
        if (value == null
                || value.length() > MAX_LENGTH
                || !FORMAT.matcher(value).matches()) {
            throw new AppException(ErrorCode.CAKE_ATTRIBUTE_CODE_INVALID);
        }
    }

    /** A code sent in a request; surrounding spaces are ignored. */
    public static CakeAttributeCode of(String value) {
        return new CakeAttributeCode(value == null ? null : value.trim());
    }

    /** From a label key ("banh nuong" → "banh-nuong"); anything not a letter or digit becomes one hyphen. */
    static CakeAttributeCode fromKey(String labelKey) {
        String hyphenated = NOT_LETTER_OR_DIGIT.matcher(labelKey).replaceAll("-");
        return new CakeAttributeCode(EDGE_HYPHENS.matcher(hyphenated).replaceAll(""));
    }

    @Override
    public String toString() {
        return value;
    }
}
