package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class AccountTest {

    @Test
    void allFormsOfOneNumberAreStoredTheSame() {
        // AC-01.3: register, login and the demo seed all store the 9 subscriber digits
        assertEquals(
                "912345678", Account.builder().phoneNumber("0912345678").build().getPhoneNumber());
        assertEquals(
                "912345678",
                Account.builder().phoneNumber("84912345678").build().getPhoneNumber());
        assertEquals(
                "912345678",
                Account.builder().phoneNumber("+84912345678").build().getPhoneNumber());
        assertEquals(
                "912345678",
                Account.builder().phoneNumber(" 0912345678 ").build().getPhoneNumber());
    }

    @Test
    void emailIsStoredTrimmedAndLowerCase() {
        // login lower-cases the identifier, so the seeded admin must be stored the same way
        assertEquals(
                "admin@moonkage.vn",
                Account.builder().email(" Admin@MoonKage.vn ").build().getEmail());
    }

    @Test
    void noPhoneStaysNull() {
        assertNull(Account.builder().phoneNumber((String) null).build().getPhoneNumber());
        assertNull(Account.builder().phoneNumber(" ").build().getPhoneNumber());
    }

    @Test
    void nfcIsLockedOnlyBeforeLockedUntil() {
        Instant now = Instant.now();
        assertFalse(Account.builder().build().getNfcLockout().isLocked(now));
        assertTrue(Account.builder()
                .nfcLockedUntil(now.plusSeconds(60))
                .build()
                .getNfcLockout()
                .isLocked(now));
        assertFalse(
                Account.builder().nfcLockedUntil(now).build().getNfcLockout().isLocked(now));
        assertFalse(Account.builder()
                .nfcLockedUntil(now.minusSeconds(60))
                .build()
                .getNfcLockout()
                .isLocked(now));
    }
}
