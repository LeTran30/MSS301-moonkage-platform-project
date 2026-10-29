package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * One test per line of the Account invariant table (docs/services/identity/domain-model-plan.md): an account cannot be
 * built wrong, and every change keeps it right. Normalising email and phone: ValueObjectsTest.
 */
class AccountTest {

    private static final Email EMAIL = Email.of("lan@x.vn");
    private static final PhoneNumber PHONE = PhoneNumber.of("0912345678");
    private static final PasswordHash HASH = PasswordHash.of(AccountFixtures.PASSWORD_HASH);
    private static final PasswordHash NEW_HASH =
            PasswordHash.of("$2a$10$zyxwvutsrqponmlkjihgfeuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a");
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    @Test
    void newMemberStartsAsAnUnconfirmedMember() {
        Account account = Account.registerMember(EMAIL, PHONE, HASH);

        assertEquals(EMAIL, account.getEmail());
        assertEquals(PHONE, account.getPhoneNumber());
        assertEquals(HASH, account.getPasswordHash());
        assertEquals(Role.MEMBER, account.getRole());
        assertFalse(account.isAccountVerified());
        assertNull(account.getPasswordChangedAt());
        // JPA draws the id at the first save
        assertNull(account.getId());
    }

    @Test
    void phoneNumberIsOptional() {
        assertNull(Account.registerMember(EMAIL, null, HASH).getPhoneNumber());
    }

    @Test
    void emailAndPasswordHashAreRequired() {
        assertInvalid(() -> Account.registerMember(null, PHONE, HASH));
        assertInvalid(() -> Account.registerMember(EMAIL, PHONE, null));
    }

    @Test
    void confirmingEmailOnlyGoesOneWay() {
        Account account = Account.registerMember(EMAIL, PHONE, HASH);

        account.confirmEmail();
        assertTrue(account.isAccountVerified());

        account.confirmEmail();
        assertTrue(account.isAccountVerified());
    }

    @Test
    void passwordChangeRecordsWhenItHappened() {
        Account account = Account.registerMember(EMAIL, PHONE, HASH);

        account.changePassword(NEW_HASH, NOW);

        assertEquals(NEW_HASH, account.getPasswordHash());
        assertEquals(NOW, account.getPasswordChangedAt());
    }

    @Test
    void passwordChangeNeedsAHashAndATime() {
        Account account = Account.registerMember(EMAIL, PHONE, HASH);

        assertInvalid(() -> account.changePassword(null, NOW));
        assertInvalid(() -> account.changePassword(NEW_HASH, null));
        assertEquals(HASH, account.getPasswordHash());
        assertNull(account.getPasswordChangedAt());
    }

    /** A missing value here is a bug in the caller, not bad input (plan v2, 5.4). */
    private static void assertInvalid(Runnable change) {
        assertThrows(NullPointerException.class, change::run);
    }
}
