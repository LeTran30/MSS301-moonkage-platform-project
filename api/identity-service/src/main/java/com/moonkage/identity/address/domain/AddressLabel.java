package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;

/** Optional tag the owner gives an address, such as "Nhà riêng" or "Văn phòng". */
public record AddressLabel(String value) {

    public static final int MAX_LENGTH = 30;

    public AddressLabel {
        Text.assertPresent(value, "address label");
    }

    /** Trimmed; REQUIRED when blank, TOO_LONG past {@link #MAX_LENGTH} characters. */
    public static AddressLabel parse(String raw) {
        return new AddressLabel(Text.bounded(raw, MAX_LENGTH));
    }
}
