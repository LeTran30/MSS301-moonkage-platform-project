package com.moonkage.identity.shared;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * The id of an account, shared by every module that refers to one (plan v2, 5.5). Made by {@code IdGenerator} when
 * the account is created. Not personal data: it may be logged.
 */
public record AccountId(UUID value) {

    public AccountId {
        Objects.requireNonNull(value, "account id");
    }

    /**
     * From outside text (URL, JWT, internal request). Not a UUID gives empty: the caller answers "not found", never
     * "bad input", so a prober cannot tell the two apart. Any UUID version is accepted.
     */
    public static Optional<AccountId> tryParse(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new AccountId(UUID.fromString(raw.trim())));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * From an id column that is still {@code varchar} (phases 4 to 8b). A value that is no UUID is corrupt data, so it
     * fails with IllegalArgumentException (500). Deleted in phase 8b.
     */
    public static AccountId fromStored(String stored) {
        return new AccountId(UUID.fromString(stored));
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
