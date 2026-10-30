package com.moonkage.identity.nfc.domain;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.nfc.NfcError;
import com.moonkage.identity.shared.error.AppException;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** AC-04.9: the counter and lockout value, and the rules it is checked against. */
class KycLockoutTest {

    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");
    private static final NfcRules RULES = new NfcRules(Duration.ofMinutes(5), 3, Duration.ofMinutes(15));

    @Test
    void lastAllowedAttemptLocksAndRestartsTheCount() {
        NfcLockout failedOnce = NfcLockout.NONE.recordFailure(RULES, NOW);
        assertEquals(1, failedOnce.failedAttempts());
        assertEquals(2, failedOnce.attemptsLeft(RULES));
        assertFalse(failedOnce.isLocked(NOW));

        NfcLockout failedTwice = failedOnce.recordFailure(RULES, NOW);
        assertEquals(2, failedTwice.failedAttempts());
        assertFalse(failedTwice.isLocked(NOW));

        NfcLockout locked = failedTwice.recordFailure(RULES, NOW);
        assertEquals(0, locked.failedAttempts());
        assertTrue(locked.isLocked(NOW));
        assertTrue(locked.isLocked(NOW.plus(Duration.ofMinutes(14))));
        assertFalse(locked.isLocked(NOW.plus(Duration.ofMinutes(15))));
        assertTrue(locked.isFinished(NOW.plus(Duration.ofMinutes(15))));
    }

    @Test
    void whileLockedNothingIsCountedAndAfterwardsAFreshRoundStarts() {
        NfcLockout locked = new NfcLockout(0, NOW.plus(Duration.ofMinutes(15)));

        // a card checked in parallel with the one that locked changes nothing
        assertEquals(locked, locked.recordFailure(RULES, NOW));
        assertEquals(new NfcLockout(1, null), locked.recordFailure(RULES, NOW.plus(Duration.ofMinutes(16))));
    }

    @Test
    void lockoutCannotHoldAnImpossibleState() {
        assertThrows(IllegalArgumentException.class, () -> new NfcLockout(-1, null));
        // a lockout restarts the count, so a locked value has no failed attempts
        assertThrows(IllegalArgumentException.class, () -> new NfcLockout(2, NOW));
    }

    @Test
    void lockedKycTellsTheMinutesLeftRoundedUp() {
        NfcLockout locked = new NfcLockout(0, NOW.plus(Duration.ofSeconds(90)));

        AppException ex = assertThrows(AppException.class, () -> locked.ensureNotLocked(NOW));

        assertEquals(NfcError.LOCKED, ex.getErrorCode());
        assertArrayEquals(new Object[] {2L}, ex.getArgs());
        locked.ensureNotLocked(NOW.plus(Duration.ofSeconds(90)));
    }

    @Test
    void rulesRefuseAWrongConfiguration() {
        Duration minutes = Duration.ofMinutes(15);
        assertThrows(IllegalStateException.class, () -> new NfcRules(minutes, 0, minutes));
        assertThrows(IllegalStateException.class, () -> new NfcRules(minutes, 5, Duration.ZERO));
        assertThrows(IllegalStateException.class, () -> new NfcRules(minutes, 5, null));
        assertThrows(IllegalStateException.class, () -> new NfcRules(Duration.ofSeconds(-1), 5, minutes));
    }
}
