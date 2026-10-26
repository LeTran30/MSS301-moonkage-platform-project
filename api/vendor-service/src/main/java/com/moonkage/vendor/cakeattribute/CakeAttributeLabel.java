package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.text.Diacritics;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * The name of a crust or filling as buyers and sellers read it, e.g. "Đậu xanh" (FR-54): composed, trimmed, single
 * spaces, with at least one letter or digit that survives without its diacritics, so a code can be built from it.
 */
public record CakeAttributeLabel(String value) {

    /** Keeps the code built from the label within cake_attributes.code: a code is never longer than its label. */
    public static final int MAX_LENGTH = CakeAttributeCode.MAX_LENGTH;

    private static final Pattern SPACES = Pattern.compile("\\s+");
    private static final Pattern LETTER_OR_DIGIT = Pattern.compile("[A-Za-z0-9]");

    public CakeAttributeLabel {
        if (value == null) {
            throw invalid();
        }
        value = SPACES.matcher(Normalizer.normalize(value, Normalizer.Form.NFC).trim())
                .replaceAll(" ");
        if (value.length() > MAX_LENGTH
                || !LETTER_OR_DIGIT.matcher(Diacritics.strip(value)).find()) {
            throw invalid();
        }
    }

    public static CakeAttributeLabel of(String value) {
        return new CakeAttributeLabel(value);
    }

    /**
     * What two labels are compared on (AC-54.2): no diacritics, lower case, single spaces. "Đậu  Xanh" and "dau xanh"
     * have the same key.
     */
    public String key() {
        return Diacritics.strip(value).toLowerCase(Locale.ROOT);
    }

    /** The code a value created with this label gets (AC-54.1). */
    public CakeAttributeCode toCode() {
        return CakeAttributeCode.fromKey(key());
    }

    private static AppException invalid() {
        return new AppException(ErrorCode.CAKE_ATTRIBUTE_LABEL_INVALID, MAX_LENGTH);
    }

    @Override
    public String toString() {
        return value;
    }
}
