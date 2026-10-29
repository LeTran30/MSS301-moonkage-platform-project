package com.moonkage.identity.common;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.util.regex.Pattern;

/**
 * The checks an entity or value object runs on every value it is given, so no path can build one in a wrong state or
 * change it into one (docs/services/identity/domain-model-plan.md, rule 1). A broken rule answers 400 INVALID_INPUT
 * with the field name as argument; a request DTO normally catches it first, with a message per field.
 */
public final class DomainGuard {

    private DomainGuard() {}

    public static <T> T requireNonNull(T value, String field) {
        if (value == null) {
            throw invalid(field);
        }
        return value;
    }

    /** Trimmed; blank or longer than maxLength is refused. */
    public static String requireText(String value, int maxLength, String field) {
        String trimmed = requireNonNull(value, field).trim();
        if (trimmed.isEmpty() || trimmed.length() > maxLength) {
            throw invalid(field);
        }
        return trimmed;
    }

    /** Null and blank both mean "not set" and come back as null; anything else follows {@link #requireText}. */
    public static String optionalText(String value, int maxLength, String field) {
        return value == null || value.isBlank() ? null : requireText(value, maxLength, field);
    }

    /** The whole value must match; it is not trimmed. */
    public static String requireMatches(String value, Pattern pattern, String field) {
        if (!pattern.matcher(requireNonNull(value, field)).matches()) {
            throw invalid(field);
        }
        return value;
    }

    public static int requireAtLeast(int value, int min, String field) {
        if (value < min) {
            throw invalid(field);
        }
        return value;
    }

    private static AppException invalid(String field) {
        return new AppException(ErrorCode.INVALID_INPUT, field);
    }
}
