package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;

/** House number and street, below the ward. */
public record StreetDetail(String value) {

    public static final int MAX_LENGTH = 255;

    public StreetDetail {
        Text.assertPresent(value, "street detail");
    }

    /** Trimmed; REQUIRED when blank, TOO_LONG past {@link #MAX_LENGTH} characters. */
    public static StreetDetail parse(String raw) {
        return new StreetDetail(Text.bounded(raw, MAX_LENGTH));
    }
}
