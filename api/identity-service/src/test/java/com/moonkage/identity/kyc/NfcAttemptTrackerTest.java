package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** AC-04.9 in memory: each account counted on its own, parallel failures all counted, finished lockouts dropped. */
class NfcAttemptTrackerTest {

    private static final String LAN = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final String MAI = "0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55";
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    private final NfcProperties nfcProperties = new NfcProperties();
    private final NfcAttemptTracker tracker = new NfcAttemptTracker(nfcProperties);

    @Test
    void accountsAreCountedSeparately() {
        tracker.recordFailure(LAN, NOW);
        tracker.recordFailure(LAN, NOW);

        assertEquals(2, tracker.lockoutOf(LAN).failedAttempts());
        assertEquals(NfcLockout.NONE, tracker.lockoutOf(MAI));
    }

    @Test
    void lockedAccountRefusesToStartUntilTheLockoutEnds() {
        lock(LAN, NOW);

        AppException ex = assertThrows(AppException.class, () -> tracker.ensureNotLocked(LAN, NOW));
        assertEquals(ErrorCode.NFC_LOCKED, ex.getErrorCode());
        tracker.ensureNotLocked(LAN, NOW.plus(nfcProperties.getLockoutDuration()));
    }

    @Test
    void verifiedCardClearsTheAccount() {
        tracker.recordFailure(LAN, NOW);

        tracker.clear(LAN);

        assertEquals(NfcLockout.NONE, tracker.lockoutOf(LAN));
    }

    @Test
    void purgeDropsOnlyFinishedLockouts() {
        lock(LAN, NOW.minus(Duration.ofHours(1)));
        lock(MAI, NOW);

        tracker.purgeFinished(NOW);

        assertEquals(NfcLockout.NONE, tracker.lockoutOf(LAN));
        assertEquals(
                NOW.plus(nfcProperties.getLockoutDuration()),
                tracker.lockoutOf(MAI).lockedUntil());
    }

    @Test
    void parallelFailuresAreAllCounted() throws InterruptedException {
        int failures = nfcProperties.getMaxAttempts() - 1;
        ExecutorService pool = Executors.newFixedThreadPool(failures);
        CountDownLatch start = new CountDownLatch(1);
        for (int i = 0; i < failures; i++) {
            pool.execute(() -> {
                try {
                    start.await();
                    tracker.recordFailure(LAN, NOW);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        start.countDown();
        pool.shutdown();

        assertTrue(pool.awaitTermination(5, TimeUnit.SECONDS));
        assertEquals(failures, tracker.lockoutOf(LAN).failedAttempts());
    }

    private void lock(String accountId, Instant at) {
        for (int i = 0; i < nfcProperties.getMaxAttempts(); i++) {
            tracker.recordFailure(accountId, at);
        }
    }
}
