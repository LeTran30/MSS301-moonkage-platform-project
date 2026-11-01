package com.moonkage.identity.account.atom;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.io.Serializable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A Vietnamese mobile number. {@code value} is always the 9 subscriber digits (912345678): the one form stored in
 * the database, returned by the API and compared, so 0912…, 84912…, +84912… and 912… are the same number (AC-01.3).
 * Immutable and self-validating; the frontend adds the leading 0 when it shows the number.
 */
public record PhoneNumber(String value) implements Serializable {

    /** What a request may send: national (0…) or international (84… / +84…). */
    public static final String REGEX = "^(\\+?84|0)[35789]\\d{8}$";

    public static final String NATIONAL_PREFIX = "0";
    public static final String INTERNATIONAL_PREFIX = "+84";
    public static final int SUBSCRIBER_DIGITS = 9;

    /** Group 1 = the 9 subscriber digits; a 9-digit input starting with 84 stays as it is (no prefix to strip). */
    private static final Pattern INPUT =
            Pattern.compile("^(?:\\+84|84|0)?([35789]\\d{" + (SUBSCRIBER_DIGITS - 1) + "})$");

    private static final int MASK_VISIBLE_HEAD = 2;
    private static final int MASK_VISIBLE_TAIL = 3;
    private static final String MASK = "****";

    public PhoneNumber {
        value = toSubscriberDigits(value);
    }

    public static PhoneNumber of(String value) {
        return new PhoneNumber(value);
    }

    public static boolean isValid(String value) {
        return value != null && INPUT.matcher(value.trim()).matches();
    }

    /** 0912345678: the number a person dials. */
    public String toNational() {
        return NATIONAL_PREFIX + value;
    }

    /** +84912345678 */
    public String toInternational() {
        return INTERNATIONAL_PREFIX + value;
    }

    /** 091****678, for logs and messages. */
    public String masked() {
        String national = toNational();
        return national.substring(0, NATIONAL_PREFIX.length() + MASK_VISIBLE_HEAD)
                + MASK
                + national.substring(national.length() - MASK_VISIBLE_TAIL);
    }

    @Override
    public String toString() {
        return value;
    }

    private static String toSubscriberDigits(String input) {
        if (input == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        Matcher matcher = INPUT.matcher(input.trim());
        if (!matcher.matches()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return matcher.group(1);
    }
}
