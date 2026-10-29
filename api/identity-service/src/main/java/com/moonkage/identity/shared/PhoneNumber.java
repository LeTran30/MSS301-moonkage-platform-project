package com.moonkage.identity.shared;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.CommonError;
import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A Vietnamese mobile number. {@code value} is always the 9 subscriber digits (912345678): the one form stored in
 * the database, returned by the API and compared. People type it in the national form only, 0 then 9 digits
 * (decision C1); the frontend adds the leading 0 when it shows the number. {@code toString} is masked.
 */
public record PhoneNumber(String value) {

    /**
     * What a request may send: the national form. Transitional (plan v2 phase 3): read by the request DTOs' Bean
     * Validation until they parse through {@code FieldParser}.
     */
    public static final String REGEX = "^0[35789]\\d{8}$";

    public static final String NATIONAL_PREFIX = "0";
    public static final int SUBSCRIBER_DIGITS = 9;

    /** Group 1 = the 9 subscriber digits: a mobile prefix, then 8 digits. */
    private static final Pattern NATIONAL_INPUT =
            Pattern.compile("^" + NATIONAL_PREFIX + "([35789]\\d{" + (SUBSCRIBER_DIGITS - 1) + "})$");

    private static final int MASK_VISIBLE_HEAD = 2;
    private static final int MASK_VISIBLE_TAIL = 3;
    private static final String MASK = "****";

    /** Rebuilt from a trusted source (database, the domain itself): no input rule runs here. */
    public PhoneNumber {
        Text.assertPresent(value, "phone number");
    }

    /** What a person typed: the national form 0912345678, spaces around it ignored. */
    public static PhoneNumber parse(String raw) {
        Matcher matcher = NATIONAL_INPUT.matcher(Text.required(raw));
        if (!matcher.matches()) {
            throw ValueRejected.badFormat();
        }
        return new PhoneNumber(matcher.group(1));
    }

    /**
     * {@link #parse} for callers that still answer a bad value with a plain 400 {@code COMMON_400}. Transitional (plan
     * v2 phase 3): removed when account, auth and address read input through {@code FieldParser} (phases 4–7).
     */
    public static PhoneNumber of(String raw) {
        try {
            return parse(raw);
        } catch (ValueRejected e) {
            throw new AppException(CommonError.INVALID_INPUT);
        }
    }

    /** Whether {@link #parse} accepts it. Transitional, like {@link #of}. */
    public static boolean isValid(String raw) {
        return raw != null && NATIONAL_INPUT.matcher(raw.trim()).matches();
    }

    /** 0912345678: the number a person dials. */
    public String toNational() {
        return NATIONAL_PREFIX + value;
    }

    /** 091****678, for logs and messages. */
    public String masked() {
        String national = toNational();
        if (national.length() <= MASK_VISIBLE_HEAD + MASK_VISIBLE_TAIL + NATIONAL_PREFIX.length()) {
            return MASK;
        }
        return national.substring(0, NATIONAL_PREFIX.length() + MASK_VISIBLE_HEAD)
                + MASK
                + national.substring(national.length() - MASK_VISIBLE_TAIL);
    }

    @Override
    public String toString() {
        return masked();
    }
}
