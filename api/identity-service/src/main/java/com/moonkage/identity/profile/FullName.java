package com.moonkage.identity.profile;

import com.moonkage.identity.shared.value.Text;

/** The name a person goes by inside the platform, as they typed it (FR-01). Not checked against any card. */
public record FullName(String value) {

    public static final int MAX_LENGTH = 100;

    public FullName {
        Text.assertPresent(value, "full name");
    }

    /** Trimmed; REQUIRED when blank, TOO_LONG past {@link #MAX_LENGTH} characters. */
    public static FullName parse(String raw) {
        return new FullName(Text.bounded(raw, MAX_LENGTH));
    }
}
