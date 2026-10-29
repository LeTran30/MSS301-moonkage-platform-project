package com.moonkage.identity.account;

import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;

/** A password as the person typed it: never trimmed, never logged (plan v2, 4.2). */
public record RawPassword(String value) {

    public static final int MIN_LENGTH = 8;

    /** BCrypt only reads the first 72 bytes; counted in characters (decision C4). */
    public static final int MAX_LENGTH = 72;

    public RawPassword {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("password is empty");
        }
    }

    /**
     * A new password, for registration and reset: the whole policy. Throws ValueRejected REQUIRED, TOO_SHORT or
     * TOO_LONG; the last two carry both limits, as the message names both.
     */
    public static RawPassword parse(String raw) {
        String typed = forLogin(raw).value();
        if (typed.length() < MIN_LENGTH) {
            throw ValueRejected.tooShort(MIN_LENGTH).with(ValueRejected.MAX, MAX_LENGTH);
        }
        if (typed.length() > MAX_LENGTH) {
            throw ValueRejected.tooLong(MAX_LENGTH).with(ValueRejected.MIN, MIN_LENGTH);
        }
        return new RawPassword(typed);
    }

    /**
     * A password typed to log in: only required, so a password set before the policy got stricter still works.
     * Throws ValueRejected REQUIRED when blank.
     */
    public static RawPassword forLogin(String raw) {
        if (raw == null || raw.isBlank()) {
            throw ValueRejected.required();
        }
        return new RawPassword(raw);
    }

    @Override
    public String toString() {
        return Text.HIDDEN;
    }
}
