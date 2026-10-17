package com.moonkage.identity.util;

/** Vietnamese mobile numbers, stored in one form so "0912…" and "84912…" are the same account (AC-01.3). */
public final class PhoneNumbers {

    /** 0xxxxxxxxx, 84xxxxxxxxx or +84xxxxxxxxx, mobile prefixes 3/5/7/8/9. */
    public static final String PATTERN = "^(\\+?84|0)[35789]\\d{8}$";

    /** Subscriber digits after the 0 / 84 / +84 prefix. */
    private static final int SUBSCRIBER_DIGITS = 9;

    private PhoneNumbers() {}

    /** Returns the 0-prefixed 10-digit form; null/blank stays null. Assumes the value already matched PATTERN. */
    public static String normalize(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.trim();
        return "0" + digits.substring(digits.length() - SUBSCRIBER_DIGITS);
    }
}
