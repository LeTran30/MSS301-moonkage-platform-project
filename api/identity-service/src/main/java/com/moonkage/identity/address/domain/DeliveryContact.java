package com.moonkage.identity.address.domain;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import java.util.Objects;

/** Recipient and location: what an order copies, so later edits and deletes of the address never touch it. */
@Embeddable
public record DeliveryContact(
        @Embedded Recipient recipient, @Embedded DeliveryLocation location) {

    public DeliveryContact {
        Objects.requireNonNull(recipient, "recipient");
        Objects.requireNonNull(location, "location");
    }
}
