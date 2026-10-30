package com.moonkage.identity.nfc.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.CardHolder;
import com.moonkage.identity.nfc.CardVerdict;
import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionStatus;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor;
import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor.SealedCardFields;
import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import com.moonkage.identity.nfc.domain.NfcLockout;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.nfc.domain.NfcSession;
import com.moonkage.identity.nfc.infrastructure.memory.InMemoryStores;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.LegalName;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * AC-04.2 - AC-04.9 with the real session and attempt stores; the seal is mocked and the verdict is a stub. Each case
 * changes one thing of a valid card sent into a fresh session.
 */
class CheckNfcCardTest {

    static final AccountId OWNER = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    static final AccountId OTHER = AccountId.fromStored("0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55");
    static final NfcRules RULES = new NfcRules(Duration.ofMinutes(5), 5, Duration.ofMinutes(15));

    /** 10:00 in Vietnam, 2026-10-30. */
    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");

    private static final String SEALED = "jwe";
    private static final String ID_NUMBER = "079123456789";
    private static final CardHolder HOLDER = new CardHolder(CitizenId.parse(ID_NUMBER), new LegalName("NGUYEN VAN A"));

    private final MovableClock clock = new MovableClock(NOW);
    private final NfcSessionStore sessions = InMemoryStores.sessions();
    private final NfcAttemptStore attempts = InMemoryStores.attempts();
    private final CardPayloadDecryptor decryptor = mock(CardPayloadDecryptor.class);
    private final CheckNfcCard checkNfcCard = new CheckNfcCard(sessions, attempts, decryptor, RULES, clock);

    /** What the verdict was asked about, in order. */
    private final List<CardHolder> judged = new ArrayList<>();

    private final CardVerdict accept = holder -> {
        judged.add(holder);
        return Optional.empty();
    };

    @BeforeEach
    void setUp() {
        when(decryptor.decrypt(SEALED))
                .thenReturn(Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1, TP HO CHI MINH")));
    }

    // ───────── the card ─────────

    @Test
    void validCardIsJudgedByWhoItsHolderIs() {
        failTimes(3, NOW);
        NfcSessionId session = openSession(OWNER);

        CardCheck check = checkValid(session, accept);

        assertEquals(CardCheck.Result.VERIFIED, check.result());
        assertEquals(List.of(HOLDER), judged);
        // a verified card starts the account clean
        assertEquals(NfcLockout.NONE, attempts.lockoutOf(OWNER));
        assertEquals(
                NfcSessionStatus.VERIFIED, sessions.find(session).orElseThrow().status());
    }

    @Test
    void unopenableSealIsBadFormatAndCounts() {
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());

        assertRejected(checkValid(openSession(OWNER), accept), NfcReasonCode.BAD_FORMAT, 4);
        assertEquals(1, attempts.lockoutOf(OWNER).failedAttempts());
        assertEquals(List.of(), judged);
    }

    @Test
    void cardOffTheFormatIsBadFormat() {
        assertRejected(
                check(openSession(OWNER), OWNER, "Nguyen Van A", "2046-01-01", accept), NfcReasonCode.BAD_FORMAT, 4);
    }

    @Test
    void fifthFailureLocksForFifteenMinutes() {
        failTimes(4, NOW);
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());

        CardCheck check = checkValid(openSession(OWNER), accept);

        assertRejected(check, NfcReasonCode.BAD_FORMAT, 0);
        Instant lockedUntil = NOW.plus(Duration.ofMinutes(15));
        assertEquals(lockedUntil, check.lockedUntil());
        assertEquals(new NfcLockout(0, lockedUntil), attempts.lockoutOf(OWNER));
    }

    @Test
    void lockedAccountIsRejectedBeforeTheSealIsOpened() {
        // locked 5 minutes ago for 15: 10 minutes left
        failTimes(5, NOW.minus(Duration.ofMinutes(5)));

        CardCheck check = checkValid(openSession(OWNER), accept);

        assertRejected(check, NfcReasonCode.LOCKED, 0);
        assertEquals(NOW.plus(Duration.ofMinutes(10)), check.lockedUntil());
        verify(decryptor, never()).decrypt(anyString());
    }

    @Test
    void finishedLockoutStartsAFreshRound() {
        // locked 16 minutes ago for 15: over a minute ago
        failTimes(5, NOW.minus(Duration.ofMinutes(16)));
        when(decryptor.decrypt(SEALED)).thenReturn(Optional.empty());

        assertRejected(checkValid(openSession(OWNER), accept), NfcReasonCode.BAD_FORMAT, 4);
        assertNull(attempts.lockoutOf(OWNER).lockedUntil());
    }

    @Test
    void expiredCardIsRejectedButOneExpiringTodayIsNot() {
        NfcSessionId session = openSession(OWNER);

        assertRejected(check(session, OWNER, "NGUYEN VAN A", "2026-10-29", accept), NfcReasonCode.CARD_EXPIRED, 4);
        assertEquals(
                CardCheck.Result.VERIFIED,
                check(session, OWNER, "NGUYEN VAN A", "2026-10-30", accept).result());
    }

    @Test
    void verdictThatCountsIsCounted() {
        NfcSessionId session = openSession(OWNER);

        assertRejected(
                checkValid(session, holder -> Optional.of(NfcReasonCode.ID_ALREADY_LINKED)),
                NfcReasonCode.ID_ALREADY_LINKED,
                4);
        assertEquals(
                NfcSessionStatus.PENDING, sessions.find(session).orElseThrow().status());
    }

    @Test
    void verdictThatDoesNotCountIsNotCounted() {
        CardCheck check = checkValid(openSession(OWNER), holder -> Optional.of(NfcReasonCode.SESSION_USED));

        assertEquals(NfcReasonCode.SESSION_USED, check.reasonCode());
        assertNull(check.attemptsLeft());
        assertEquals(NfcLockout.NONE, attempts.lockoutOf(OWNER));
    }

    // ───────── the session around it ─────────

    @Test
    void unknownOrExpiredSessionIsRejected() {
        NfcSession expired = NfcSession.open(OWNER, NOW);
        sessions.replacePendingOf(expired);

        assertEquals(
                NfcReasonCode.SESSION_EXPIRED,
                checkValid(NfcSessionId.generate(), accept).reasonCode());
        assertEquals(
                NfcReasonCode.SESSION_EXPIRED, checkValid(expired.id(), accept).reasonCode());
        verifyNoInteractions(decryptor);
    }

    @Test
    void cardFromAnotherAccountIsRejected() {
        CardCheck check = check(openSession(OWNER), OTHER, "NGUYEN VAN A", "2046-01-01", accept);

        assertEquals(CardCheck.Result.REJECTED, check.result());
        assertEquals(NfcReasonCode.SESSION_NOT_OWNED, check.reasonCode());
        verifyNoInteractions(decryptor);
    }

    @Test
    void verifiedSessionCannotBeUsedAgain() {
        NfcSessionId session = openSession(OWNER);

        assertEquals(CardCheck.Result.VERIFIED, checkValid(session, accept).result());
        assertEquals(NfcReasonCode.SESSION_USED, checkValid(session, accept).reasonCode());
        assertEquals(1, judged.size());
    }

    @Test
    void rejectedCardLeavesTheSessionOpenForAnotherTry() {
        NfcSessionId session = openSession(OWNER);

        assertEquals(
                NfcReasonCode.BAD_FORMAT,
                check(session, OWNER, "Nguyen", "2046-01-01", accept).reasonCode());
        assertEquals(
                NfcSessionStatus.PENDING, sessions.find(session).orElseThrow().status());
        assertEquals(CardCheck.Result.VERIFIED, checkValid(session, accept).result());
    }

    @Test
    void secondCardWhileTheFirstIsCheckedIsRejected() {
        NfcSessionId session = openSession(OWNER);
        AtomicReference<CardCheck> second = new AtomicReference<>();
        when(decryptor.decrypt(SEALED)).thenAnswer(invocation -> {
            second.set(checkValid(session, accept));
            return Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1"));
        });

        assertEquals(CardCheck.Result.VERIFIED, checkValid(session, accept).result());
        assertEquals(NfcReasonCode.SESSION_USED, second.get().reasonCode());
        assertEquals(1, judged.size());
    }

    @Test
    void failingVerdictDoesNotLeaveTheSessionStuck() {
        NfcSessionId session = openSession(OWNER);

        assertThrows(
                IllegalStateException.class,
                () -> checkValid(session, holder -> {
                    throw new IllegalStateException("database down");
                }));
        assertEquals(
                NfcSessionStatus.PENDING, sessions.find(session).orElseThrow().status());
        assertEquals(NfcLockout.NONE, attempts.lockoutOf(OWNER));
    }

    @Test
    void serverFaultDoesNotLeaveTheSessionStuck() {
        NfcSessionId session = openSession(OWNER);
        when(decryptor.decrypt(SEALED))
                .thenThrow(new IllegalStateException("NFC_TRANSPORT_PRIVATE_KEY_V1 is not set"))
                .thenReturn(Optional.of(new SealedCardFields(ID_NUMBER, "1990-05-01", "QUAN 1")));

        assertThrows(IllegalStateException.class, () -> checkValid(session, accept));
        assertEquals(CardCheck.Result.VERIFIED, checkValid(session, accept).result());
    }

    private NfcSessionId openSession(AccountId owner) {
        NfcSession session = NfcSession.open(owner, NOW.plus(RULES.sessionTtl()));
        sessions.replacePendingOf(session);
        return session.id();
    }

    private CardCheck checkValid(NfcSessionId session, CardVerdict verdict) {
        return check(session, OWNER, "NGUYEN VAN A", "2046-01-01", verdict);
    }

    private CardCheck check(
            NfcSessionId session, AccountId caller, String fullName, String expiry, CardVerdict verdict) {
        SubmittedCard card = new SubmittedCard(fullName, "MALE", "VIET NAM", "HA NOI", "2021-01-01", expiry, SEALED);
        return checkNfcCard.handle(session, caller, card, verdict);
    }

    /** Failed cards of OWNER counted at the given moment; five lock it until then + 15 minutes. */
    private void failTimes(int times, Instant at) {
        for (int i = 0; i < times; i++) {
            attempts.recordFailure(OWNER, RULES, at);
        }
    }

    private static void assertRejected(CardCheck check, NfcReasonCode reason, int attemptsLeft) {
        assertEquals(CardCheck.Result.REJECTED, check.result());
        assertEquals(reason, check.reasonCode());
        assertEquals(attemptsLeft, check.attemptsLeft());
    }
}
