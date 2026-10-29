package com.moonkage.identity.kyc.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.kyc.KycError;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionStatus;
import com.moonkage.identity.kyc.infrastructure.memory.InMemoryStores;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.LegalName;
import com.moonkage.identity.profile.MaskedIdNumber;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

/** AC-04.1, AC-04.2: opening a QR session, reading it back, and freeing the memory of old ones. */
class NfcSessionUseCasesTest {

    private static final AccountId OWNER = SubmitNfcCardTest.OWNER;
    private static final AccountId OTHER = SubmitNfcCardTest.OTHER;
    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");

    private final MovableClock clock = new MovableClock(NOW);
    private final NfcSessionStore sessions = InMemoryStores.sessions();
    private final KycAttemptStore attempts = InMemoryStores.attempts();
    private final ProfileApi profiles = mock(ProfileApi.class);
    private final CreateNfcSession create =
            new CreateNfcSession(profiles, sessions, attempts, SubmitNfcCardTest.RULES, clock);
    private final GetNfcSession get = new GetNfcSession(sessions, clock);

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

        assertEquals(NOW.plus(SubmitNfcCardTest.RULES.sessionTtl()), session.expiresAt());
        assertEquals(NfcSessionStatus.PENDING, get.handle(session.id(), OWNER).status());
    }

    @Test
    void verifiedAccountCannotOpenASession() {
        when(profiles.findKyc(OWNER))
                .thenReturn(Optional.of(new LegalIdentity(
                        new LegalName("NGUYEN VAN A"),
                        new IdNumberHash("0".repeat(IdNumberHash.LENGTH)),
                        1,
                        new MaskedIdNumber("********0000"))));

        assertError(KycError.ALREADY_VERIFIED, () -> create.handle(OWNER));
    }

    @Test
    void lockedAccountCannotOpenASessionUntilTheLockoutEnds() {
        for (int i = 0; i < SubmitNfcCardTest.RULES.maxAttempts(); i++) {
            attempts.recordFailure(OWNER, SubmitNfcCardTest.RULES, NOW);
        }

        assertError(KycError.LOCKED, () -> create.handle(OWNER));
        clock.advance(SubmitNfcCardTest.RULES.lockoutDuration());
        create.handle(OWNER);
    }

    @Test
    void newSessionReplacesThePendingOne() {
        NfcSessionId old = create.handle(OWNER).id();
        NfcSessionId current = create.handle(OWNER).id();

        assertError(KycError.SESSION_EXPIRED, () -> get.handle(old, OWNER));
        assertEquals(NfcSessionStatus.PENDING, get.handle(current, OWNER).status());
    }

    @Test
    void sessionIsReadableByItsOwnerUntilItExpires() {
        NfcSessionId session = create.handle(OWNER).id();

        assertError(KycError.SESSION_NOT_OWNED, () -> get.handle(session, OTHER));
        assertError(KycError.SESSION_EXPIRED, () -> get.handle(NfcSessionId.generate(), OWNER));
        clock.advance(SubmitNfcCardTest.RULES.sessionTtl());
        assertError(KycError.SESSION_EXPIRED, () -> get.handle(session, OWNER));
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
