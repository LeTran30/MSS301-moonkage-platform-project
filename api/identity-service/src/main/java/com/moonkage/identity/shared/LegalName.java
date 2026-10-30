package com.moonkage.identity.shared;

import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.regex.Pattern;

/** The name printed on the ID card: upper case, no diacritics, words split by one space (A-08). */
public record LegalName(String value) {

    public static final int MAX_LENGTH = 100;

    private static final Pattern PATTERN = Pattern.compile("[A-Z]+( [A-Z]+)*");

    public LegalName {
        Text.assertPresent(value, "legal name");
    }

    /** Taken as sent, never trimmed: a card field off the pattern is a bad card. */
    public static LegalName parse(String raw) {
        if (raw == null || raw.isEmpty()) {
            throw ValueRejected.required();
        }
        if (raw.length() > MAX_LENGTH) {
            throw ValueRejected.tooLong(MAX_LENGTH);
        }
        if (!PATTERN.matcher(raw).matches()) {
            throw ValueRejected.badFormat();
        }
        return new LegalName(raw);
    }
}
