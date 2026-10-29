package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.kyc.CitizenId;
import com.moonkage.identity.shared.error.AppException;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class ValueObjectsTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void passwordHashEncapsulatesAndProtectsRawHash() {
        PasswordHash hash = PasswordHash.fromRawPassword("Secret123!", encoder);
        assertNotNull(hash.hash());
        assertTrue(hash.matches("Secret123!", encoder));
        assertFalse(hash.matches("WrongPassword", encoder));
        assertEquals("[PROTECTED]", hash.toString());

        assertThrows(AppException.class, () -> PasswordHash.of("plain-text"));
        assertThrows(AppException.class, () -> PasswordHash.of(null));
        assertThrows(AppException.class, () -> PasswordHash.fromRawPassword(" ", encoder));
    }

    @Test
    void rawPasswordMustFitBcrypt() {
        assertThrows(AppException.class, () -> PasswordHash.fromRawPassword("a".repeat(7), encoder));
        assertThrows(AppException.class, () -> PasswordHash.fromRawPassword("a".repeat(73), encoder));
        assertTrue(PasswordHash.fromRawPassword("a".repeat(8), encoder).matches("a".repeat(8), encoder));
        assertTrue(PasswordHash.fromRawPassword("a".repeat(72), encoder).matches("a".repeat(72), encoder));
    }

    @Test
    void citizenIdValidatesAndMasksCorrectly() {
        CitizenId id = CitizenId.of("001098012345");
        assertEquals("001098012345", id.value());
        assertEquals("********2345", id.masked());
        assertEquals("001", id.provinceCode());
        assertEquals("********2345", id.toString());

        assertThrows(AppException.class, () -> CitizenId.of("12345"));
        assertThrows(AppException.class, () -> CitizenId.of("00109801234a"));
        assertThrows(AppException.class, () -> CitizenId.of(null));
    }
}
