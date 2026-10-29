package com.moonkage.identity.kyc.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.identity.kyc.application.port.CardPayloadDecryptor;
import com.moonkage.identity.kyc.application.port.CardPayloadDecryptor.SealedCardFields;
import com.moonkage.identity.kyc.application.port.IdNumberHasher;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.KycEvents;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.kyc.domain.KycLockout;
import com.moonkage.identity.kyc.domain.KycReasonCode;
import com.moonkage.identity.kyc.domain.KycResult;
import com.moonkage.identity.kyc.domain.KycRules;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionStatus;
import com.moonkage.identity.kyc.infrastructure.memory.InMemoryStores;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.KycCompletion;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.LegalName;
import com.moonkage.identity.profile.MaskedIdNumber;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * AC-04.2 - AC-04.9 with the real session and attempt stores; the seal, the profile and the events are mocked. Each
 * case changes one thing of a valid card sent into a fresh session.
 */
class SubmitNfcCardTest {

    static final AccountId OWNER = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    static final AccountId OTHER = AccountId.fromStored("0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55");
    static final KycRules RULES = new KycRules(Duration.ofMinutes(5), 5, Duration.ofMinutes(15));

    /** 10:00 in Vietnam, 2026-10-30. */
    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");

    private static final String SEALED = "jwe";
    private static final String ID_NUMBER = "079123456789";
    private static final MaskedIdNumber MASKED = new MaskedIdNumber("********6789");

    /** Not HMAC, but as stable: the number padded to 64 hex digits. */
    static final IdNumberHasher HASHER = new IdNumberHasher() {
        @Override
        public IdNumberHash hash(CitizenId idNumber) {
            return new IdNumberHash("0".repeat(IdNumberHash.LENGTH - CitizenId.DIGITS) + idNumber.value());
        }

        @Override
        public int keyVersion() {
            return 1;
        }
    };

    private static final LegalIdentity IDENTITY =
            new LegalIdentity(new LegalName("NGUYEN VAN A"), HASHER.hash(CitizenId.parse(ID_NUMBER)), 1, MASKED);

    private final MovableClock clock = new MovableClock(NOW);
    private final NfcSessionStore sessions = InMemoryStores.sessions();
    private final KycAttemptStore attempts = InMemoryStores.attempts();
    private final CardPayloadDecryptor decryptor = mock(CardPayloadDecryptor.class);
    private final ProfileApi profiles = mock(ProfileApi.class);
    private final KycEvents events = mock(KycEvents.class);
    private final SubmitNfcCard submitNfcCard = new SubmitNfcCard(
            sessions,
            attempts,
            decryptor,
            HASHER,
            profiles,
            events,
            RULES,
            new TransactionTemplate(mock(PlatformTransactionManager.class)),
            clock);

    @BeforeEach
    void setUp() {
        when(decryptor.decrypt(SEALED))
                .thenReturn(Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1, TP HO CHI MINH")));
        when(profiles.completeKyc(any(), any())).thenReturn(KycCompletion.COMPLETED);
    }

    // ───────── the card ─────────

    @Test
    void validCardCompletesKycWithTheMaskedAndHashedNumberOnly() {
        failTimes(3, NOW);
        NfcSessionId session = openSession(OWNER);

        SubmitNfcCard.Outcome outcome = submit(session, OWNER, "NGUYEN VAN A", "2046-01-01");

        assertEquals(KycResult.VERIFIED, outcome.result());
        verify(profiles).completeKyc(OWNER, IDENTITY);
        verify(events).verified(OWNER, session, MASKED, NOW);
        // a verified card starts the account clean
        assertEquals(KycLockout.NONE, attempts.lockoutOf(OWNER));
        assertEquals(
                NfcSessionStatus.VERIFIED, sessions.find(session).orElseThrow().status());
    }

    @Test
    void unopenableSealIsBadFormatAndCounts() {
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());
        NfcSessionId session = openSession(OWNER);

        assertRejected(submitValid(session), KycReasonCode.BAD_FORMAT, 4);
        assertEquals(1, attempts.lockoutOf(OWNER).failedAttempts());
        verify(events).failed(OWNER, session, KycReasonCode.BAD_FORMAT, 4, NOW);
        verify(profiles, never()).completeKyc(any(), any());
    }

    @Test
    void cardOffTheFormatIsBadFormat() {
        assertRejected(submit(openSession(OWNER), OWNER, "Nguyen Van A", "2046-01-01"), KycReasonCode.BAD_FORMAT, 4);
    }

    @Test
    void fifthFailureLocksForFifteenMinutes() {
        failTimes(4, NOW);
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());
        NfcSessionId session = openSession(OWNER);

        SubmitNfcCard.Outcome outcome = submitValid(session);

        assertRejected(outcome, KycReasonCode.BAD_FORMAT, 0);
        Instant lockedUntil = NOW.plus(Duration.ofMinutes(15));
        assertEquals(lockedUntil, outcome.lockedUntil());
        assertEquals(new KycLockout(0, lockedUntil), attempts.lockoutOf(OWNER));
        verify(events).locked(OWNER, session, KycReasonCode.BAD_FORMAT, lockedUntil, NOW);
    }

    @Test
    void lockedAccountIsRejectedBeforeTheSealIsOpened() {
        // locked 5 minutes ago for 15: 10 minutes left
        failTimes(5, NOW.minus(Duration.ofMinutes(5)));

        SubmitNfcCard.Outcome outcome = submitValid(openSession(OWNER));

        assertRejected(outcome, KycReasonCode.LOCKED, 0);
        assertEquals(NOW.plus(Duration.ofMinutes(10)), outcome.lockedUntil());
        verify(decryptor, never()).decrypt(anyString());
        verifyNoInteractions(events);
    }

    @Test
    void finishedLockoutStartsAFreshRound() {
        // locked 16 minutes ago for 15: over a minute ago
        failTimes(5, NOW.minus(Duration.ofMinutes(16)));
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());

        assertRejected(submitValid(openSession(OWNER)), KycReasonCode.BAD_FORMAT, 4);
        assertNull(attempts.lockoutOf(OWNER).lockedUntil());
    }

    @Test
    void expiredCardIsRejectedButOneExpiringTodayIsNot() {
        NfcSessionId session = openSession(OWNER);

        assertRejected(submit(session, OWNER, "NGUYEN VAN A", "2026-10-29"), KycReasonCode.CARD_EXPIRED, 4);
        assertEquals(
                KycResult.VERIFIED,
                submit(session, OWNER, "NGUYEN VAN A", "2026-10-30").result());
    }

    @Test
    void numberOfAnotherAccountIsRejectedAndCounts() {
        when(profiles.completeKyc(OWNER, IDENTITY)).thenReturn(KycCompletion.ID_NUMBER_TAKEN);
        NfcSessionId session = openSession(OWNER);

        assertRejected(submitValid(session), KycReasonCode.ID_ALREADY_LINKED, 4);
        verify(events).failed(OWNER, session, KycReasonCode.ID_ALREADY_LINKED, 4, NOW);
    }

    @Test
    void verifiedAccountCannotVerifyAgain() {
        when(profiles.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        assertEquals(KycReasonCode.SESSION_USED, submitValid(openSession(OWNER)).reasonCode());
        verify(decryptor, never()).decrypt(anyString());
        verify(profiles, never()).completeKyc(any(), any());
    }

    @Test
    void parallelCardOfTheSameAccountThatWonIsSessionUsed() {
        when(profiles.completeKyc(OWNER, IDENTITY)).thenReturn(KycCompletion.ALREADY_COMPLETED);

        SubmitNfcCard.Outcome outcome = submitValid(openSession(OWNER));

        assertEquals(KycReasonCode.SESSION_USED, outcome.reasonCode());
        assertNull(outcome.attemptsLeft());
        verifyNoInteractions(events);
    }

    // ───────── the session around it ─────────

    @Test
    void unknownOrExpiredSessionIsRejected() {
        NfcSession expired = NfcSession.open(OWNER, NOW);
        sessions.replacePendingOf(expired);

        assertEquals(
                KycReasonCode.SESSION_EXPIRED,
                submitValid(NfcSessionId.generate()).reasonCode());
        assertEquals(KycReasonCode.SESSION_EXPIRED, submitValid(expired.id()).reasonCode());
        verifyNoInteractions(decryptor);
    }

    @Test
    void cardFromAnotherAccountIsRejected() {
        SubmitNfcCard.Outcome outcome = submit(openSession(OWNER), OTHER, "NGUYEN VAN A", "2046-01-01");

        assertEquals(KycResult.REJECTED, outcome.result());
        assertEquals(KycReasonCode.SESSION_NOT_OWNED, outcome.reasonCode());
        verifyNoInteractions(decryptor);
    }

    @Test
    void verifiedSessionCannotBeUsedAgain() {
        NfcSessionId session = openSession(OWNER);

        assertEquals(KycResult.VERIFIED, submitValid(session).result());
        assertEquals(KycReasonCode.SESSION_USED, submitValid(session).reasonCode());
        verify(profiles, times(1)).completeKyc(any(), any());
    }

    @Test
    void rejectedCardLeavesTheSessionOpenForAnotherTry() {
        NfcSessionId session = openSession(OWNER);

        assertEquals(
                KycReasonCode.BAD_FORMAT,
                submit(session, OWNER, "Nguyen", "2046-01-01").reasonCode());
        assertEquals(
                NfcSessionStatus.PENDING, sessions.find(session).orElseThrow().status());
        assertEquals(KycResult.VERIFIED, submitValid(session).result());
    }

    @Test
    void secondCardWhileTheFirstIsCheckedIsRejected() {
        NfcSessionId session = openSession(OWNER);
        AtomicReference<SubmitNfcCard.Outcome> second = new AtomicReference<>();
        when(decryptor.decrypt(SEALED)).thenAnswer(invocation -> {
            second.set(submitValid(session));
            return Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1"));
        });

        assertEquals(KycResult.VERIFIED, submitValid(session).result());
        assertEquals(KycReasonCode.SESSION_USED, second.get().reasonCode());
        verify(profiles, times(1)).completeKyc(any(), any());
    }

    @Test
    void uniqueKeyRaceIsAnsweredAsIdAlreadyLinked() {
        when(profiles.completeKyc(OWNER, IDENTITY)).thenThrow(new IdNumberTakenMeanwhile(null));
        NfcSessionId session = openSession(OWNER);

        SubmitNfcCard.Outcome outcome = submitValid(session);

        assertEquals(KycReasonCode.ID_ALREADY_LINKED, outcome.reasonCode());
        assertNull(outcome.attemptsLeft());
        assertEquals(
                NfcSessionStatus.PENDING, sessions.find(session).orElseThrow().status());
        verify(events, never()).failed(any(), any(), any(), anyInt(), any());
    }

    @Test
    void serverFaultDoesNotLeaveTheSessionStuck() {
        NfcSessionId session = openSession(OWNER);
        when(decryptor.decrypt(SEALED))
                .thenThrow(new IllegalStateException("NFC_TRANSPORT_PRIVATE_KEY_V1 is not set"))
                .thenReturn(Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1")));

        assertThrows(IllegalStateException.class, () -> submitValid(session));
        assertEquals(KycResult.VERIFIED, submitValid(session).result());
        verify(events).verified(eq(OWNER), eq(session), eq(MASKED), any());
    }

    private NfcSessionId openSession(AccountId owner) {
        NfcSession session = NfcSession.open(owner, NOW.plus(RULES.sessionTtl()));
        sessions.replacePendingOf(session);
        return session.id();
    }

    private SubmitNfcCard.Outcome submitValid(NfcSessionId session) {
        return submit(session, OWNER, "NGUYEN VAN A", "2046-01-01");
    }

    private SubmitNfcCard.Outcome submit(NfcSessionId session, AccountId caller, String fullName, String expiry) {
        return submitNfcCard.handle(new SubmitNfcCard.Command(
                session, caller, fullName, "MALE", "VIET NAM", "HA NOI", "2021-01-01", expiry, SEALED));
    }

    /** Failed cards of OWNER counted at the given moment; five lock it until then + 15 minutes. */
    private void failTimes(int times, Instant at) {
        for (int i = 0; i < times; i++) {
            attempts.recordFailure(OWNER, RULES, at);
        }
    }

    private static void assertRejected(SubmitNfcCard.Outcome outcome, KycReasonCode reason, int attemptsLeft) {
        assertEquals(KycResult.REJECTED, outcome.result());
        assertEquals(reason, outcome.reasonCode());
        assertEquals(attemptsLeft, outcome.attemptsLeft());
    }
}
