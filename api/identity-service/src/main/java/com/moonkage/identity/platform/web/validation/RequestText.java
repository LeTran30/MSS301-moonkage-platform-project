package com.moonkage.identity.platform.web.validation;

/**
 * How a request record cleans its own text in its compact constructor, before Bean Validation reads it. Services
 * never normalize (docs/conventions/coding-rules.md): what reaches them is already clean. Every method keeps null as
 * null, so {@code @NotBlank} still reports a missing field.
 */
public final class RequestText {

    private RequestText() {}

    /** Surrounding spaces removed. */
    public static String trim(String value) {
        return value == null ? null : value.trim();
    }

    /** Surrounding spaces removed; blank becomes null, for an optional field. */
    public static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Only the digits: spaces, dots and dashes people type inside a number are dropped. */
    public static String digitsOnly(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }
}
