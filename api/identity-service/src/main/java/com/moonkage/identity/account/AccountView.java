package com.moonkage.identity.account;

import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Read-only snapshot of an account for other modules; the Account entity never leaves the module.
 *
 * @param phoneNumber null when not given
 * @param passwordChangedAt null until the first change
 */
public record AccountView(
        AccountId id, Email email, PhoneNumber phoneNumber, Role role, boolean verified, Instant passwordChangedAt) {

    /** A token issued before the last password change must not work anymore (Q-04). */
    public boolean acceptsTokenIssuedAt(Instant issuedAt) {
        // a JWT keeps whole seconds only
        return passwordChangedAt == null
                || (issuedAt != null && !issuedAt.isBefore(passwordChangedAt.truncatedTo(ChronoUnit.SECONDS)));
    }
}
