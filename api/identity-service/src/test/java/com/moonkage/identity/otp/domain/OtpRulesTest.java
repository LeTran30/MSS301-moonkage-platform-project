package com.moonkage.identity.otp.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class OtpRulesTest {

    @Test
    void entryIsKeptUntilTheLongestLimitIsOver() {
        OtpRules rules = new OtpRules(Duration.ofMinutes(5), 5, Duration.ofSeconds(60), 5, Duration.ofMinutes(15));
        // the hourly send window outlasts code, cooldown and lockout
        assertEquals(OtpRules.SEND_WINDOW, rules.retention());

        OtpRules longLockout = new OtpRules(Duration.ofMinutes(5), 5, Duration.ofSeconds(60), 5, Duration.ofHours(2));
        assertEquals(Duration.ofHours(2), longLockout.retention());
    }

    @Test
    void wrongConfigurationFailsAtStartUp() {
        assertThrows(
                IllegalArgumentException.class,
                () -> new OtpRules(Duration.ZERO, 5, Duration.ofSeconds(60), 5, Duration.ofMinutes(15)));
        assertThrows(
                IllegalArgumentException.class,
                () -> new OtpRules(Duration.ofMinutes(5), 0, Duration.ofSeconds(60), 5, Duration.ofMinutes(15)));
        assertThrows(
                IllegalArgumentException.class,
                () -> new OtpRules(Duration.ofMinutes(5), 5, null, 5, Duration.ofMinutes(15)));
    }
}
