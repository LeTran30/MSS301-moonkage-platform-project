package com.moonkage.identity.account.domain;

import com.moonkage.identity.shared.value.Text;

/**
 * A stored password hash. Made only by {@code PasswordHasher}; knows nothing of the algorithm (plan v2, 5.2) and never
 * leaves the account module.
 */
public record PasswordHash(String value) {

    public PasswordHash {
        Text.assertPresent(value, "password hash");
    }

    @Override
    public String toString() {
        return Text.HIDDEN;
    }
}
