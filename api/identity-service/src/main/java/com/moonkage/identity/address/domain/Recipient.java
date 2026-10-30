package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.PhoneNumber;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.Objects;

/** Who takes the delivery, and the number the shipper calls (stored as the 9 subscriber digits). */
@Embeddable
public record Recipient(
        @Column(name = "recipient_name", nullable = false, length = RecipientName.MAX_LENGTH)
        RecipientName name,

        @Column(name = "recipient_phone", nullable = false, length = PhoneNumber.SUBSCRIBER_DIGITS)
        PhoneNumber phone) {

    public Recipient {
        Objects.requireNonNull(name, "recipient name");
        Objects.requireNonNull(phone, "recipient phone");
    }
}
