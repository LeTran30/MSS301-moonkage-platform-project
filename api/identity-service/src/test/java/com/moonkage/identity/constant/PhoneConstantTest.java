package com.moonkage.identity.constant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PhoneConstantTest {

    @Test
    void patternAcceptsMobileNumbersOnly() {
        assertTrue("0912345678".matches(PhoneConstant.PATTERN));
        assertTrue("84912345678".matches(PhoneConstant.PATTERN));
        assertTrue("+84312345678".matches(PhoneConstant.PATTERN));
        assertFalse("8491234567".matches(PhoneConstant.PATTERN)); // too short with 84
        assertFalse("0212345678".matches(PhoneConstant.PATTERN)); // landline prefix
        assertFalse("091234567".matches(PhoneConstant.PATTERN));
    }
}
