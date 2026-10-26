package com.moonkage.identity.account.vo;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.io.Serializable;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Value Object representing a normalized user email address.
 * Immutable and self-validating.
 */
public record Email(String value) implements Serializable {

    private static final Pattern PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final int MAX_LENGTH = 255;
    private static final int MASK_PREFIX_LENGTH = 1;

    public Email {
        if (value == null || value.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        value = value.trim().toLowerCase(Locale.ROOT);
        if (value.length() > MAX_LENGTH || !PATTERN.matcher(value).matches()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }

    public static Email of(String value) {
        return new Email(value);
    }

    public String domain() {
        int atIndex = value.indexOf('@');
        return atIndex >= 0 ? value.substring(atIndex + 1) : "";
    }

    public String masked() {
        int atIndex = value.indexOf('@');
        if (atIndex <= MASK_PREFIX_LENGTH) {
            return value;
        }
        return value.charAt(0) + "***" + value.substring(atIndex - 1);
    }

    @Override
    public String toString() {
        return value;
    }
}
