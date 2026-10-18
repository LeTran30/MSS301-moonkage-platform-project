package com.moonkage.identity.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * api/docs/seed/01_demo_seller_identity.sql hashes the demo password in SQL with pgcrypto. Login must accept it:
 * this hash was made by {@code crypt('Demo@12345', gen_salt('bf', 10))} on postgres:17-alpine.
 */
class SeedPasswordHashTest {

    private static final String PGCRYPTO_HASH = "$2a$10$WR5NXT8ro73iZLNkDBsMrObhE8VYZ43Hf2IynbzZU0SK3ZF1pXfWW";

    @Test
    void loginAcceptsAPasswordHashedByPgcrypto() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        assertTrue(encoder.matches("Demo@12345", PGCRYPTO_HASH));
        assertFalse(encoder.matches("wrong", PGCRYPTO_HASH));
    }
}
