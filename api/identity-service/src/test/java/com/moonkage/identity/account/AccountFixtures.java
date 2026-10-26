package com.moonkage.identity.account;

import jakarta.persistence.EntityManager;

/**
 * Test-only door into the account component: repository tests of other components need a real accounts row for
 * their foreign key, but the Account entity is package-private.
 */
public final class AccountFixtures {

    /** A valid BCrypt shape; no test logs in with it. */
    public static final String PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a";

    private AccountFixtures() {}

    /** Persists a verified MEMBER and returns its id. */
    public static String persistMember(EntityManager entityManager, String email) {
        Account account = Account.builder()
                .email(email)
                .passwordHash(PASSWORD_HASH)
                .accountVerified(true)
                .role(Role.MEMBER)
                .build();
        entityManager.persist(account);
        entityManager.flush();
        return account.getId();
    }
}
