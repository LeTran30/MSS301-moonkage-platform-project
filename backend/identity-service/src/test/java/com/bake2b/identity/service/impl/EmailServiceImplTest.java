package com.bake2b.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class EmailServiceImplTest {

    private EmailServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new EmailServiceImpl(null, null);
        ReflectionTestUtils.setField(service, "otpTtl", Duration.ofMinutes(5));
        ReflectionTestUtils.setField(service, "maxAttempts", 3);
    }

    @Test
    void correctOtpPasses() {
        service.storageOtp("a@x.vn", "123456");
        assertTrue(service.verifyOtp("a@x.vn", "123456"));
    }

    @Test
    void tooManyWrongGuessesKillTheCode() {
        service.storageOtp("a@x.vn", "123456");
        for (int i = 0; i < 3; i++) {
            assertFalse(service.verifyOtp("a@x.vn", "000000"));
        }
        assertFalse(service.verifyOtp("a@x.vn", "123456"));
    }

    @Test
    void expiredOtpFails() {
        ReflectionTestUtils.setField(service, "otpTtl", Duration.ofMillis(-1));
        service.storageOtp("a@x.vn", "123456");
        assertFalse(service.verifyOtp("a@x.vn", "123456"));
    }

    @Test
    void otpIsSixDigits() {
        assertEquals(6, service.generateOTP().length());
    }
}
