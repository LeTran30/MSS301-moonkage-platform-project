package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** AC-04.9: the counter and lockout value, and the policy it is checked against. */
class NfcLockoutTest {

    @Test
    void nfcLockoutEnforcesStateTransitions() {
        NfcLockout lockout = NfcLockout.NONE;
        Instant now = Instant.now();
        assertFalse(lockout.isLocked(now));
        assertEquals(0, lockout.failedAttempts());

        NfcLockoutPolicy policy = new NfcLockoutPolicy(3, Duration.ofMinutes(15));

        NfcLockout failedOnce = lockout.recordFailure(policy, now);
        assertEquals(1, failedOnce.failedAttempts());
        assertEquals(2, failedOnce.attemptsLeft(policy));
        assertFalse(failedOnce.isLocked(now));

        NfcLockout failedTwice = failedOnce.recordFailure(policy, now);
        assertEquals(2, failedTwice.failedAttempts());
        assertFalse(failedTwice.isLocked(now));

        // the last allowed attempt locks and restarts the count for the round after the lockout
        NfcLockout locked = failedTwice.recordFailure(policy, now);
        assertEquals(0, locked.failedAttempts());
        assertTrue(locked.isLocked(now));
        assertTrue(locked.isLocked(now.plus(Duration.ofMinutes(14))));
        assertFalse(locked.isLocked(now.plus(Duration.ofMinutes(16))));

        assertEquals(locked, locked.clearFinished(now));
        assertEquals(NfcLockout.NONE, locked.clearFinished(now.plus(Duration.ofMinutes(16))));

        // while locked nothing is counted; after the lockout a fresh round starts at 1
        AppException ex = assertThrows(AppException.class, () -> locked.recordFailure(policy, now));
        assertEquals(LegacyError.NFC_LOCKED, ex.getErrorCode());
        assertEquals(new NfcLockout(1, null), locked.recordFailure(policy, now.plus(Duration.ofMinutes(16))));
    }

    @Test
    void nfcLockoutCannotHoldAnImpossibleState() {
        Instant now = Instant.now();

        assertThrows(IllegalArgumentException.class, () -> new NfcLockout(-1, null));
        // a lockout restarts the count, so a locked value has no failed attempts
        assertThrows(IllegalArgumentException.class, () -> new NfcLockout(2, now));
    }

    @Test
    void lockedNfcTellsTheMinutesLeftRoundedUp() {
        Instant now = Instant.now();
        NfcLockout locked = new NfcLockout(0, now.plus(Duration.ofSeconds(90)));

        AppException ex = assertThrows(AppException.class, () -> locked.ensureNotLocked(now));

        assertEquals(LegacyError.NFC_LOCKED, ex.getErrorCode());
        assertArrayEquals(new Object[] {2L}, ex.getArgs());
        locked.ensureNotLocked(now.plus(Duration.ofSeconds(90)));
    }

    @Test
    void nfcLockoutPolicyRefusesAWrongConfiguration() {
        assertThrows(IllegalStateException.class, () -> new NfcLockoutPolicy(0, Duration.ofMinutes(15)));
        assertThrows(IllegalStateException.class, () -> new NfcLockoutPolicy(5, Duration.ZERO));
        assertThrows(IllegalStateException.class, () -> new NfcLockoutPolicy(5, null));
    }
}
