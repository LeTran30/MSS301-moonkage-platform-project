package com.moonkage.identity.address.domain;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/** The id of one address. Made by {@code IdGenerator} when the address is added. */
public record AddressId(UUID value) {

    public AddressId {
        Objects.requireNonNull(value, "address id");
    }

    /** From a URL. Not a UUID gives empty: the caller answers "not found", as for an unknown id. */
    public static Optional<AddressId> tryParse(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new AddressId(UUID.fromString(raw.trim())));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
