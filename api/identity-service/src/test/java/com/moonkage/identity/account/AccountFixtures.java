package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.atom.PhoneNumber;
import jakarta.persistence.EntityManager;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Test-only door into the account component: repository tests of other components need a real accounts row for
 * their foreign key, but the Account entity is package-private. Accounts are built the one way production builds
 * them, through {@link Account#registerMember}.
 */
public final class AccountFixtures {

    /** A valid BCrypt shape; no test logs in with it. */
    public static final String PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a";

    private AccountFixtures() {}

    /** Persists a verified MEMBER and returns its id. */
    public static String persistMember(EntityManager entityManager, String email) {
        Account account = verifiedMember(email, null);
        entityManager.persist(account);
        entityManager.flush();
        return account.getId().toString();
    }

    /** A MEMBER whose email is confirmed, as after FR-01; phone may be null. */
    static Account verifiedMember(String email, String phone) {
        Account account = Account.registerMember(
                Email.of(email), phone == null ? null : PhoneNumber.of(phone), PasswordHash.of(PASSWORD_HASH));
        account.confirmEmail();
        return account;
    }

    /** For unit tests that need a known id: the factory always draws a new one. */
    static Account withId(Account account, String id) {
        ReflectionTestUtils.setField(account, "id", id);
        return account;
    }
}
