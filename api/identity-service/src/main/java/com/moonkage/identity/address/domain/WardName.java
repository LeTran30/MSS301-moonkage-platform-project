package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;

/** Ward, commune or special zone, as display text (L-15). */
public record WardName(String value) {

    public static final int MAX_LENGTH = 100;

    public WardName {
        Text.assertPresent(value, "ward name");
    }

    /** Trimmed; REQUIRED when blank, TOO_LONG past {@link #MAX_LENGTH} characters. */
    public static WardName parse(String raw) {
        return new WardName(Text.bounded(raw, MAX_LENGTH));
    }
}
