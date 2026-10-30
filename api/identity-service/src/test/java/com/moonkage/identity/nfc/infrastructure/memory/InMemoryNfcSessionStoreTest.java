package com.moonkage.identity.nfc.infrastructure.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.nfc.domain.NfcSession;
import com.moonkage.identity.shared.AccountId;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** AC-04.1, Q-24: one pending session per account; expired ones freed unless a card is being checked. */
class InMemoryNfcSessionStoreTest {

    private static final AccountId OWNER =
            AccountId.tryParse("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10").orElseThrow();
    private static final AccountId OTHER =
            AccountId.tryParse("0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55").orElseThrow();
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");
    private static final Instant LATER = NOW.plus(Duration.ofMinutes(5));

    private final InMemoryNfcSessionStore store = new InMemoryNfcSessionStore();

    @Test
    void newSessionReplacesThePendingOneOfTheSameOwnerOnly() {
        NfcSession old = NfcSession.open(OWNER, LATER);
        NfcSession others = NfcSession.open(OTHER, LATER);
        store.replacePendingOf(old);
        store.replacePendingOf(others);

        NfcSession current = NfcSession.open(OWNER, LATER);
        store.replacePendingOf(current);

        assertTrue(store.find(old.id()).isEmpty());
        assertTrue(store.find(current.id()).isPresent());
        assertTrue(store.find(others.id()).isPresent());
    }

    @Test
    void verifiedSessionIsKeptWhenANewOneOpens() {
        NfcSession verified = NfcSession.open(OWNER, LATER).released(true);
        store.replacePendingOf(verified);

        store.replacePendingOf(NfcSession.open(OWNER, LATER));

        assertTrue(store.find(verified.id()).isPresent());
    }

    @Test
    void parallelCreatesLeaveOnePendingSession() throws Exception {
        int threads = 16;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<NfcSession>> created = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            Callable<NfcSession> create = () -> {
                start.await();
                NfcSession session = NfcSession.open(OWNER, LATER);
                store.replacePendingOf(session);
                return session;
            };
            created.add(pool.submit(create));
        }
        start.countDown();
        List<NfcSession> opened = new ArrayList<>();
        for (Future<NfcSession> session : created) {
            opened.add(session.get(5, TimeUnit.SECONDS));
        }
        pool.shutdownNow();
        long kept = opened.stream()
                .filter(session -> store.find(session.id()).isPresent())
                .count();

        // Q-24: only the newest QR of an account works
        assertEquals(1, kept);
    }

    @Test
    void removeExpiredSparesLiveSessionsAndCardsBeingChecked() {
        NfcSession live = NfcSession.open(OWNER, LATER);
        NfcSession expired = NfcSession.open(OTHER, NOW);
        AccountId third =
                AccountId.tryParse("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d").orElseThrow();
        NfcSession checking = NfcSession.open(third, NOW).claimed();
        store.replacePendingOf(live);
        store.replacePendingOf(expired);
        store.replacePendingOf(checking);

        store.removeExpired(NOW);

        assertTrue(store.find(live.id()).isPresent());
        assertTrue(store.find(expired.id()).isEmpty());
        assertTrue(store.find(checking.id()).isPresent());
    }

    @Test
    void updateChangesOnlyAKeptSession() {
        NfcSession session = NfcSession.open(OWNER, LATER);
        store.replacePendingOf(session);

        store.update(session.id(), NfcSession::claimed);
        store.update(NfcSession.open(OWNER, LATER).id(), NfcSession::claimed);

        assertTrue(store.find(session.id()).orElseThrow().inFlight());
    }
}
