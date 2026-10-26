package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.regex.Pattern;

/**
 * Number of the bank account in the vendor's name (AC-26.1): digits only, spaces and dots removed. It is stored
 * encrypted and shown only as {@link #masked()} (NFR-03, P-09), so {@link #toString()} never prints it.
 */
public record BankAccountNumber(String value) {

    /** Shortest and longest account numbers Vietnamese banks issue. */
    public static final int MIN_DIGITS = 6;

    public static final int MAX_DIGITS = 19;

    /** Digits left visible at the end of the masked form. */
    private static final int VISIBLE_TAIL = 4;

    private static final char MASK = '*';
    private static final Pattern SEPARATORS = Pattern.compile("[\\s.]+");
    private static final Pattern FORMAT = Pattern.compile("^\\d{" + MIN_DIGITS + "," + MAX_DIGITS + "}$");

    public BankAccountNumber {
        if (value == null) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_NUMBER_INVALID, MIN_DIGITS, MAX_DIGITS);
        }
        value = SEPARATORS.matcher(value).replaceAll("");
        if (!FORMAT.matcher(value).matches()) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_NUMBER_INVALID, MIN_DIGITS, MAX_DIGITS);
        }
    }

    public static BankAccountNumber of(String value) {
        return new BankAccountNumber(value);
    }

    /** "0123456789" → "******6789"; fits bank_account_masked (20). */
    public String masked() {
        int hidden = value.length() - VISIBLE_TAIL;
        return String.valueOf(MASK).repeat(hidden) + value.substring(hidden);
    }

    @Override
    public String toString() {
        return masked();
    }
}
