package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.kyc.CitizenId;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class ValueObjectsTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void emailNormalizesAndValidatesCorrectly() {
        Email email = Email.of("  Lan.Nguyen@Example.COM  ");
        assertEquals("lan.nguyen@example.com", email.value());
        assertEquals("example.com", email.domain());
        assertEquals("l***n@example.com", email.masked());

        assertThrows(AppException.class, () -> Email.of(null));
        assertThrows(AppException.class, () -> Email.of("   "));
        assertThrows(AppException.class, () -> Email.of("invalid-email"));
    }

    @Test
    void phoneNumberTakesTheNationalFormAndStoresTheSubscriberDigits() {
        // decision C1: people type 0 then 9 digits; the 9 subscriber digits are stored, returned and compared
        PhoneNumber phone1 = PhoneNumber.of("0912345678");
        assertEquals("912345678", phone1.value());
        assertEquals("0912345678", phone1.toNational());
        assertEquals("091****678", phone1.masked());
        assertEquals(phone1, PhoneNumber.of(" 0912345678 "));
        // the stored form, as read from the database
        assertEquals(phone1, new PhoneNumber("912345678"));
        assertThrows(AppException.class, () -> new PhoneNumber("0912345678"));

        assertTrue("0912345678".matches(PhoneNumber.REGEX));
        assertTrue("0312345678".matches(PhoneNumber.REGEX));
        assertFalse("84912345678".matches(PhoneNumber.REGEX));
        assertFalse("+84912345678".matches(PhoneNumber.REGEX));
        assertFalse("0212345678".matches(PhoneNumber.REGEX));
        assertFalse("091234567".matches(PhoneNumber.REGEX));

        assertTrue(PhoneNumber.isValid("0912345678"));
        assertFalse(PhoneNumber.isValid("+84912345678"));
        assertFalse(PhoneNumber.isValid("84912345678"));
        assertFalse(PhoneNumber.isValid("912345678"));
        assertFalse(PhoneNumber.isValid("0212345678"));
        assertFalse(PhoneNumber.isValid(null));

        assertThrows(AppException.class, () -> PhoneNumber.of("+84912345678"));
        assertThrows(AppException.class, () -> PhoneNumber.of("912345678"));
        assertThrows(AppException.class, () -> PhoneNumber.of("12345"));
        assertThrows(AppException.class, () -> PhoneNumber.of("0123456789"));
        assertThrows(AppException.class, () -> PhoneNumber.of("091234567"));
        assertThrows(AppException.class, () -> PhoneNumber.of(null));
    }

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
