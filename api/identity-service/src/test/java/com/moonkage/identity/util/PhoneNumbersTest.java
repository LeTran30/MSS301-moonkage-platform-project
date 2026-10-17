package com.moonkage.identity.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PhoneNumbersTest {

    @Test
    void allFormsOfOneNumberNormalizeTheSame() {
        assertEquals("0912345678", PhoneNumbers.normalize("0912345678"));
        assertEquals("0912345678", PhoneNumbers.normalize("84912345678"));
        assertEquals("0912345678", PhoneNumbers.normalize("+84912345678"));
    }

    @Test
    void blankIsNull() {
        assertNull(PhoneNumbers.normalize(null));
        assertNull(PhoneNumbers.normalize(" "));
    }

    @Test
    void patternAcceptsMobileNumbersOnly() {
        assertTrue("0912345678".matches(PhoneNumbers.PATTERN));
        assertTrue("84912345678".matches(PhoneNumbers.PATTERN));
        assertTrue("+84312345678".matches(PhoneNumbers.PATTERN));
        assertFalse("8491234567".matches(PhoneNumbers.PATTERN)); // too short with 84
        assertFalse("0212345678".matches(PhoneNumbers.PATTERN)); // landline prefix
        assertFalse("091234567".matches(PhoneNumbers.PATTERN));
    }
}
