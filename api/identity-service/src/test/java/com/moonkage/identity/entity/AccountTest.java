package com.moonkage.identity.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class AccountTest {

    @Test
    void allFormsOfOneNumberAreStoredTheSame() {
        // AC-01.3: register, login and the demo seed all go through this one method
        assertEquals("912345678", Account.storedPhoneNumber("0912345678"));
        assertEquals("912345678", Account.storedPhoneNumber("84912345678"));
        assertEquals("912345678", Account.storedPhoneNumber("+84912345678"));
        assertEquals("912345678", Account.storedPhoneNumber(" 0912345678 "));
    }

    @Test
    void noPhoneStaysNull() {
        assertNull(Account.storedPhoneNumber(null));
        assertNull(Account.storedPhoneNumber(" "));
    }

    @Test
    void nfcIsLockedOnlyBeforeLockedUntil() {
        Instant now = Instant.now();
        assertFalse(Account.builder().build().isNfcLocked(now));
        assertTrue(Account.builder().nfcLockedUntil(now.plusSeconds(60)).build().isNfcLocked(now));
        assertFalse(Account.builder().nfcLockedUntil(now).build().isNfcLocked(now));
        assertFalse(
                Account.builder().nfcLockedUntil(now.minusSeconds(60)).build().isNfcLocked(now));
    }
}
