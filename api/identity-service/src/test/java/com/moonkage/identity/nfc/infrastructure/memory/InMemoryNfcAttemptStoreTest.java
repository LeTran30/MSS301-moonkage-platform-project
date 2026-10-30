package com.moonkage.identity.nfc.infrastructure.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.nfc.domain.NfcLockout;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.shared.AccountId;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** AC-04.9 in memory: each account counted on its own, parallel failures all counted, finished lockouts dropped. */
class InMemoryKycAttemptStoreTest {

    private static final AccountId LAN = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    private static final AccountId MAI = AccountId.fromStored("0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55");
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");
    private static final NfcRules RULES = new NfcRules(Duration.ofMinutes(5), 5, Duration.ofMinutes(15));

    private final InMemoryNfcAttemptStore store = new InMemoryNfcAttemptStore();

    @Test
    void accountsAreCountedSeparately() {
        store.recordFailure(LAN, RULES, NOW);
        store.recordFailure(LAN, RULES, NOW);

        assertEquals(2, store.lockoutOf(LAN).failedAttempts());
        assertEquals(NfcLockout.NONE, store.lockoutOf(MAI));
    }

    @Test
    void verifiedCardClearsTheAccount() {
        store.recordFailure(LAN, RULES, NOW);

        store.clear(LAN);

        assertEquals(NfcLockout.NONE, store.lockoutOf(LAN));
    }

    @Test
    void removeDropsOnlyFinishedLockouts() {
        lock(LAN, NOW.minus(Duration.ofHours(1)));
        lock(MAI, NOW);

        store.removeFinished(NOW);

        assertEquals(NfcLockout.NONE, store.lockoutOf(LAN));
        assertEquals(NOW.plus(RULES.lockoutDuration()), store.lockoutOf(MAI).lockedUntil());
    }

    @Test
    void parallelFailuresAreAllCounted() throws InterruptedException {
        int failures = RULES.maxAttempts() - 1;
        ExecutorService pool = Executors.newFixedThreadPool(failures);
        CountDownLatch start = new CountDownLatch(1);
        for (int i = 0; i < failures; i++) {
            pool.execute(() -> {
                try {
                    start.await();
                    store.recordFailure(LAN, RULES, NOW);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        start.countDown();
        pool.shutdown();

        assertTrue(pool.awaitTermination(5, TimeUnit.SECONDS));
        assertEquals(failures, store.lockoutOf(LAN).failedAttempts());
    }

    private void lock(AccountId id, Instant at) {
        for (int i = 0; i < RULES.maxAttempts(); i++) {
            store.recordFailure(id, RULES, at);
        }
    }
}
