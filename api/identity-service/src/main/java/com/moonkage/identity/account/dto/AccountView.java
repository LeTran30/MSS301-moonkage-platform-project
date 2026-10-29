package com.moonkage.identity.account.dto;

import com.moonkage.identity.account.atom.Role;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Read-only snapshot of an account for other components; the Account entity never leaves this package.
 *
 * @param phoneNumber the 9 subscriber digits (912345678), null when not given
 */
public record AccountView(
        String id, String email, String phoneNumber, Role role, boolean verified, Instant passwordChangedAt) {

    /** A token issued before the last password change must not work anymore (Q-04). */
    public boolean acceptsTokenIssuedAt(Instant issuedAt) {
        return passwordChangedAt == null
                || (issuedAt != null && !issuedAt.isBefore(passwordChangedAt.truncatedTo(ChronoUnit.SECONDS)));
    }
}
