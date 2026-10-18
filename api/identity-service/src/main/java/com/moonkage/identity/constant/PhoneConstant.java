package com.moonkage.identity.constant;

/**
 * Vietnamese mobile numbers. "0912…", "84912…" and "+84912…" are stored as the same 9 subscriber digits so they
 * resolve to one account (AC-01.3).
 */
public final class PhoneConstant {

    public static final String PATTERN = "^(\\+?84|0)[35789]\\d{8}$";

    public static final int SUBSCRIBER_DIGITS = 9;

    private PhoneConstant() {}
}
