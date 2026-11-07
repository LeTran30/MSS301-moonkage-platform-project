package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.regex.Pattern;

/**
 * Personal ID number (12 digits, CCCD) declared for the representative (BR-27). It only lives in a request on its way
 * to identity-service, which hashes it: vendor-service never stores or logs it (NFR-03), so {@link #toString()}
 * hides it.
 */
public record IdNumber(String value) {

    public static final int DIGITS = 12;

    private static final Pattern FORMAT = Pattern.compile("^\\d{" + DIGITS + "}$");
    private static final String HIDDEN = "*".repeat(DIGITS);

    public IdNumber {
        value = value == null ? null : value.trim();
        if (value == null || !FORMAT.matcher(value).matches()) {
            throw new AppException(ErrorCode.ID_NUMBER_INVALID, DIGITS);
        }
    }

    public static IdNumber of(String value) {
        return new IdNumber(value);
    }

    @Override
    public String toString() {
        return HIDDEN;
    }
}
