package com.moonkage.identity.account.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** An account cannot be built wrong, and every change keeps it right (plan v2, 4.2). */
class AccountTest {

    private static final AccountId ID = new AccountId(SequentialIdGenerator.nth(1));
    private static final Email EMAIL = Email.parse("lan@x.vn");
    private static final PhoneNumber PHONE = PhoneNumber.parse("0912345678");
    private static final PasswordHash HASH = new PasswordHash("hash-1");
    private static final PasswordHash NEW_HASH = new PasswordHash("hash-2");
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    @Test
    void newMemberStartsAsAnUnconfirmedMemberWithTheIdItWasGiven() {
        Account account = Account.registerMember(ID, EMAIL, PHONE, HASH);

        // the id exists from the start, before any save (plan v2, 5.5.1)
        assertEquals(ID, account.id());
        assertEquals(EMAIL, account.email());
        assertEquals(PHONE, account.phoneNumber());
        assertEquals(HASH, account.passwordHash());
        assertEquals(Role.MEMBER, account.role());
        assertFalse(account.verified());
        assertNull(account.passwordChangedAt());
    }

    @Test
    void phoneNumberIsOptional() {
        assertNull(Account.registerMember(ID, EMAIL, null, HASH).phoneNumber());
    }

    @Test
    void idEmailAndPasswordHashAreRequired() {
        assertBug(() -> Account.registerMember(null, EMAIL, PHONE, HASH));
        assertBug(() -> Account.registerMember(ID, null, PHONE, HASH));
        assertBug(() -> Account.registerMember(ID, EMAIL, PHONE, null));
    }

    @Test
    void confirmingEmailOnlyGoesOneWay() {
        Account account = Account.registerMember(ID, EMAIL, PHONE, HASH);

        account.confirmEmail();
        assertTrue(account.verified());

        account.confirmEmail();
        assertTrue(account.verified());
    }

    @Test
    void passwordChangeRecordsWhenItHappened() {
        Account account = Account.registerMember(ID, EMAIL, PHONE, HASH);

        account.changePassword(NEW_HASH, NOW);

        assertEquals(NEW_HASH, account.passwordHash());
        assertEquals(NOW, account.passwordChangedAt());
    }

    @Test
    void refusedPasswordChangeLeavesTheAccountAsItWas() {
        Account account = Account.registerMember(ID, EMAIL, PHONE, HASH);

        assertBug(() -> account.changePassword(null, NOW));
        assertBug(() -> account.changePassword(NEW_HASH, null));
        assertEquals(HASH, account.passwordHash());
        assertNull(account.passwordChangedAt());
    }

    @Test
    void viewShowsWhatOtherModulesMaySee() {
        Account account = Account.registerMember(ID, EMAIL, PHONE, HASH);
        account.confirmEmail();

        assertEquals(new AccountView(ID, EMAIL, PHONE, Role.MEMBER, true, null), account.view());
    }

    @Test
    void passwordHashNeverPrints() {
        assertEquals("[PROTECTED]", HASH.toString());
        assertBug(() -> new PasswordHash(" "));
    }

    /** A missing value here is a bug in the caller, not bad input (plan v2, 5.4). */
    private static void assertBug(Runnable change) {
        RuntimeException thrown = assertThrows(RuntimeException.class, change::run);
        assertTrue(
                thrown instanceof NullPointerException || thrown instanceof IllegalArgumentException, thrown::toString);
    }
}
