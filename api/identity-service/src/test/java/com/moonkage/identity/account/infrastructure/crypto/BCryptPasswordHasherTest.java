package com.moonkage.identity.account.infrastructure.crypto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.domain.PasswordHash;
import org.junit.jupiter.api.Test;

class BCryptPasswordHasherTest {

    /**
     * db/seed/R__seed.sql hashes the seed accounts' password in SQL with pgcrypto: this hash was made by {@code
     * crypt('Demo@12345', gen_salt('bf', 10))} on postgres:17-alpine.
     */
    private static final PasswordHash PGCRYPTO_HASH =
            new PasswordHash("$2a$10$WR5NXT8ro73iZLNkDBsMrObhE8VYZ43Hf2IynbzZU0SK3ZF1pXfWW");

    private final BCryptPasswordHasher hasher = new BCryptPasswordHasher();

    @Test
    void hashMatchesOnlyItsPassword() {
        RawPassword password = RawPassword.parse("secret-123");

        PasswordHash hash = hasher.hash(password);

        assertTrue(hasher.matches(password, hash));
        assertFalse(hasher.matches(RawPassword.parse("secret-124"), hash));
        // salted: the same password never gives the same hash twice
        assertNotEquals(hash, hasher.hash(password));
    }

    @Test
    void seedAccountsHashedByPgcryptoCanLogIn() {
        assertTrue(hasher.matches(RawPassword.forLogin("Demo@12345"), PGCRYPTO_HASH));
        assertFalse(hasher.matches(RawPassword.forLogin("wrong"), PGCRYPTO_HASH));
    }

    @Test
    void dummyCheckTakesAboutAsLongAsARealOne() {
        RawPassword password = RawPassword.parse("secret-123");
        PasswordHash hash = hasher.hash(password);
        // warm up both paths before timing
        hasher.matches(password, hash);
        hasher.dummyMatch(password);

        long real = timeOf(() -> hasher.matches(password, hash));
        long dummy = timeOf(() -> hasher.dummyMatch(password));

        // same cost factor: a dummy check that returned at once would let a stranger time out which emails exist
        assertTrue(dummy * 4 > real, () -> "dummy " + dummy + "ns, real " + real + "ns");
    }

    private static long timeOf(Runnable check) {
        long start = System.nanoTime();
        check.run();
        return System.nanoTime() - start;
    }
}
