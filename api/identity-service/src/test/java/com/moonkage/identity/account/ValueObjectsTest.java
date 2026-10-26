package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.account.vo.PasswordHash;
import com.moonkage.identity.account.vo.PhoneNumber;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.kyc.CitizenId;
import java.time.Duration;
import java.time.Instant;
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
    void phoneNumberNormalizesAndValidatesCorrectly() {
        // every accepted form becomes the 9 subscriber digits: the one form stored, returned and compared (AC-01.3)
        PhoneNumber phone1 = PhoneNumber.of("0912345678");
        assertEquals("912345678", phone1.value());
        assertEquals("0912345678", phone1.toNational());
        assertEquals("+84912345678", phone1.toInternational());
        assertEquals("091****678", phone1.masked());

        assertEquals(phone1, PhoneNumber.of("+84912345678"));
        assertEquals(phone1, PhoneNumber.of("84912345678"));
        assertEquals(phone1, PhoneNumber.of(" 912345678 "));
        // a stored number that itself starts with 84 is not mistaken for a country code
        assertEquals("841234567", PhoneNumber.of("841234567").value());

        assertTrue("0912345678".matches(PhoneNumber.REGEX));
        assertTrue("84912345678".matches(PhoneNumber.REGEX));
        assertTrue("+84312345678".matches(PhoneNumber.REGEX));
        assertFalse("8491234567".matches(PhoneNumber.REGEX));
        assertFalse("0212345678".matches(PhoneNumber.REGEX));
        assertFalse("091234567".matches(PhoneNumber.REGEX));

        assertTrue(PhoneNumber.isValid("0912345678"));
        assertTrue(PhoneNumber.isValid("+84912345678"));
        assertTrue(PhoneNumber.isValid("84912345678"));
        assertTrue(PhoneNumber.isValid("912345678"));
        assertFalse(PhoneNumber.isValid("0212345678"));
        assertFalse(PhoneNumber.isValid(null));

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

        assertThrows(IllegalArgumentException.class, () -> PasswordHash.of("plain-text"));
        assertThrows(IllegalArgumentException.class, () -> PasswordHash.of(null));
    }

    @Test
    void nfcLockoutEnforcesStateTransitions() {
        NfcLockout lockout = NfcLockout.NONE;
        Instant now = Instant.now();
        assertFalse(lockout.isLocked(now));
        assertEquals(0, lockout.failedAttempts());

        NfcLockout failedOnce = lockout.recordFailure(3, Duration.ofMinutes(15), now);
        assertEquals(1, failedOnce.failedAttempts());
        assertEquals(2, failedOnce.attemptsLeft(3));
        assertFalse(failedOnce.isLocked(now));

        NfcLockout failedTwice = failedOnce.recordFailure(3, Duration.ofMinutes(15), now);
        assertEquals(2, failedTwice.failedAttempts());
        assertFalse(failedTwice.isLocked(now));

        // the last allowed attempt locks and restarts the count for the round after the lockout
        NfcLockout locked = failedTwice.recordFailure(3, Duration.ofMinutes(15), now);
        assertEquals(0, locked.failedAttempts());
        assertTrue(locked.isLocked(now));
        assertTrue(locked.isLocked(now.plus(Duration.ofMinutes(14))));
        assertFalse(locked.isLocked(now.plus(Duration.ofMinutes(16))));

        assertEquals(locked, locked.clearFinished(now));
        assertEquals(NfcLockout.NONE, locked.clearFinished(now.plus(Duration.ofMinutes(16))));
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
