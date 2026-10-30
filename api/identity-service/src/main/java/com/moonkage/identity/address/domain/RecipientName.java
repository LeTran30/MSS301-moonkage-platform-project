package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;

/** Who takes the delivery. */
public record RecipientName(String value) {

    public static final int MAX_LENGTH = 100;

    public RecipientName {
        Text.assertPresent(value, "recipient name");
    }

    /** Trimmed; REQUIRED when blank, TOO_LONG past {@link #MAX_LENGTH} characters. */
    public static RecipientName parse(String raw) {
        return new RecipientName(Text.bounded(raw, MAX_LENGTH));
    }
}
