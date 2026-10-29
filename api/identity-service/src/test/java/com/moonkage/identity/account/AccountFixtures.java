package com.moonkage.identity.account;

import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.account.domain.PasswordHash;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import jakarta.persistence.EntityManager;

/**
 * Accounts for tests, built the one way production builds them, through {@link Account#registerMember}. Repository
 * tests of other modules need a real accounts row for their foreign key.
 */
public final class AccountFixtures {

    /** A valid BCrypt shape; no test logs in with it. */
    public static final String PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a";

    private static final SequentialIdGenerator IDS = new SequentialIdGenerator();

    private AccountFixtures() {}

    /** Persists a verified MEMBER and returns its id. */
    public static String persistMember(EntityManager entityManager, String email) {
        Account account = verifiedMember(email, null);
        entityManager.persist(account);
        entityManager.flush();
        return account.id().toString();
    }

    /** A MEMBER whose email is confirmed, as after FR-01; phone may be null. A new id on every call. */
    public static Account verifiedMember(String email, String phone) {
        Account account = member(email, phone);
        account.confirmEmail();
        return account;
    }

    /** A MEMBER whose email is not confirmed yet; phone may be null. A new id on every call. */
    public static Account member(String email, String phone) {
        return Account.registerMember(
                new AccountId(IDS.next()),
                Email.parse(email),
                phone == null ? null : PhoneNumber.parse(phone),
                new PasswordHash(PASSWORD_HASH));
    }
}
