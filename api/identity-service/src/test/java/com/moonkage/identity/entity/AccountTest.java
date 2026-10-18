package com.moonkage.identity.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

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
}
