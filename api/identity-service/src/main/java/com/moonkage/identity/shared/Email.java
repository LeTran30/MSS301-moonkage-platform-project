package com.moonkage.identity.shared;

import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * An email address, always lower case: the one form stored, compared and returned. {@code toString} is masked, so a
 * log never shows the whole address.
 */
public record Email(String value) {

    public static final int MAX_LENGTH = 255;

    private static final Pattern PATTERN = Pattern.compile("^[a-z0-9+_.-]+@(.+)$");
    private static final int MASK_PREFIX_LENGTH = 1;
    private static final String MASK = "***";

    /** Rebuilt from a trusted source (database, the domain itself): no input rule runs here. */
    public Email {
        Text.assertPresent(value, "email");
    }

    /** What a person typed: trimmed, lower-cased, at most {@value #MAX_LENGTH} characters, one {@code @}. */
    public static Email parse(String raw) {
        String value = Text.required(raw).toLowerCase(Locale.ROOT);
        if (value.length() > MAX_LENGTH) {
            throw ValueRejected.tooLong(MAX_LENGTH);
        }
        if (!PATTERN.matcher(value).matches()) {
            throw ValueRejected.badFormat();
        }
        return new Email(value);
    }

    /** {@code a***b@x.vn}, for logs and messages. */
    public String masked() {
        int atIndex = value.indexOf('@');
        if (atIndex <= MASK_PREFIX_LENGTH) {
            return value;
        }
        return value.charAt(0) + MASK + value.substring(atIndex - 1);
    }

    @Override
    public String toString() {
        return masked();
    }
}
