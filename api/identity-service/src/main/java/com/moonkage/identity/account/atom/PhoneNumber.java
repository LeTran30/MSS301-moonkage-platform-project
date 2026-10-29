package com.moonkage.identity.account.atom;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.io.Serializable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A Vietnamese mobile number. {@code value} is always the 9 subscriber digits (912345678): the one form stored in
 * the database, returned by the API and compared. People type it in the national form only, 0 then 9 digits
 * (decision C1, plan v2); the frontend adds the leading 0 when it shows the number.
 */
public record PhoneNumber(String value) implements Serializable {

    /** What a request may send: the national form, 0 then 9 digits starting with a mobile prefix. */
    public static final String REGEX = "^0[35789]\\d{8}$";

    public static final String NATIONAL_PREFIX = "0";
    public static final int SUBSCRIBER_DIGITS = 9;

    /** The 9 stored digits: a mobile prefix, then 8 digits. */
    private static final String SUBSCRIBER_PART = "[35789]\\d{" + (SUBSCRIBER_DIGITS - 1) + "}";

    /** Group 1 = the 9 subscriber digits. */
    private static final Pattern NATIONAL_INPUT = Pattern.compile("^" + NATIONAL_PREFIX + "(" + SUBSCRIBER_PART + ")$");

    private static final Pattern SUBSCRIBER = Pattern.compile("^" + SUBSCRIBER_PART + "$");
    private static final int MASK_VISIBLE_HEAD = 2;
    private static final int MASK_VISIBLE_TAIL = 3;
    private static final String MASK = "****";

    /** The stored form, 9 subscriber digits, e.g. from the database. */
    public PhoneNumber {
        if (value == null || !SUBSCRIBER.matcher(value).matches()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }

    /** What a person typed: the national form 0912345678, spaces around it ignored. */
    public static PhoneNumber of(String input) {
        Matcher matcher = input == null ? null : NATIONAL_INPUT.matcher(input.trim());
        if (matcher == null || !matcher.matches()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return new PhoneNumber(matcher.group(1));
    }

    /** Whether {@link #of} accepts it. */
    public static boolean isValid(String input) {
        return input != null && NATIONAL_INPUT.matcher(input.trim()).matches();
    }

    /** 0912345678: the number a person dials. */
    public String toNational() {
        return NATIONAL_PREFIX + value;
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
}
