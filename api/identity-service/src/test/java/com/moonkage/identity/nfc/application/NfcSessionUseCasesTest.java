package com.moonkage.identity.nfc.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.nfc.NfcError;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionStatus;
import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import com.moonkage.identity.nfc.domain.NfcSession;
import com.moonkage.identity.nfc.infrastructure.memory.InMemoryStores;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

/** AC-04.1, AC-04.2: opening a QR session, reading it back, and freeing the memory of old ones. */
class NfcSessionUseCasesTest {

    private static final AccountId OWNER = CheckNfcCardTest.OWNER;
    private static final AccountId OTHER = CheckNfcCardTest.OTHER;
    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");

    private final MovableClock clock = new MovableClock(NOW);
    private final NfcSessionStore sessions = InMemoryStores.sessions();
    private final NfcAttemptStore attempts = InMemoryStores.attempts();
    private final OpenNfcSession create = new OpenNfcSession(sessions, attempts, CheckNfcCardTest.RULES, clock);
    private final FindNfcSession get = new FindNfcSession(sessions, clock);

    @Test
    void sessionIdIsLongRandomAndUrlSafe() {
        String first = create.handle(OWNER).id().value();
        String second = create.handle(OTHER).id().value();

        // 192 bits, within the 16-128 characters the app accepts (Software Design 5.1, B-2)
        assertTrue(first.matches("[A-Za-z0-9_-]{32}"), first);
        assertNotEquals(first, second);
    }

    @Test
    void sessionLastsTheConfiguredTime() {
        NfcSession session = create.handle(OWNER);

        assertEquals(NOW.plus(CheckNfcCardTest.RULES.sessionTtl()), session.expiresAt());
        assertEquals(NfcSessionStatus.PENDING, get.handle(session.id(), OWNER).status());
    }

    @Test
    void lockedAccountCannotOpenASessionUntilTheLockoutEnds() {
        for (int i = 0; i < CheckNfcCardTest.RULES.maxAttempts(); i++) {
            attempts.recordFailure(OWNER, CheckNfcCardTest.RULES, NOW);
        }

        assertError(NfcError.LOCKED, () -> create.handle(OWNER));
        clock.advance(CheckNfcCardTest.RULES.lockoutDuration());
        create.handle(OWNER);
    }

    @Test
    void newSessionReplacesThePendingOne() {
        NfcSessionId old = create.handle(OWNER).id();
        NfcSessionId current = create.handle(OWNER).id();

        assertError(NfcError.SESSION_EXPIRED, () -> get.handle(old, OWNER));
        assertEquals(NfcSessionStatus.PENDING, get.handle(current, OWNER).status());
    }

    @Test
    void sessionIsReadableByItsOwnerUntilItExpires() {
        NfcSessionId session = create.handle(OWNER).id();

        assertError(NfcError.SESSION_NOT_OWNED, () -> get.handle(session, OTHER));
        assertError(NfcError.SESSION_EXPIRED, () -> get.handle(NfcSessionId.generate(), OWNER));
        clock.advance(CheckNfcCardTest.RULES.sessionTtl());
        assertError(NfcError.SESSION_EXPIRED, () -> get.handle(session, OWNER));
    }

    @Test
    void expiringFreesOnlySessionsThatRanOut() {
        NfcSessionId expired = create.handle(OWNER).id();
        clock.advance(Duration.ofMinutes(3));
        NfcSessionId live = create.handle(OTHER).id();
        clock.advance(Duration.ofMinutes(3));

        new ExpireNfcSessions(sessions, attempts, clock).handle();

        assertTrue(sessions.find(expired).isEmpty());
        assertTrue(sessions.find(live).isPresent());
    }

    private static void assertError(ErrorCode expected, Executable call) {
        assertEquals(expected, assertThrows(AppException.class, call).getErrorCode());
    }
}
