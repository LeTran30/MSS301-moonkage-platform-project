package com.moonkage.identity.profile.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.CardHolder;
import com.moonkage.identity.nfc.CardVerdict;
import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.application.port.IdNumberHasher;
import com.moonkage.identity.profile.application.port.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.application.port.KycEvents;
import com.moonkage.identity.profile.domain.LegalIdentity;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * What a card that passed the NFC checks proves (BR-23), and the events of each ending. The nfc module is mocked: it
 * hands the card to the verdict as it would.
 */
class SubmitKycCardTest {

    static final AccountId OWNER = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");

    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");
    private static final String ID_NUMBER = "079123456789";
    private static final MaskedIdNumber MASKED = new MaskedIdNumber("********6789");
    private static final CardHolder HOLDER = new CardHolder(CitizenId.parse(ID_NUMBER), new LegalName("NGUYEN VAN A"));
    private static final SubmittedCard CARD =
            new SubmittedCard("NGUYEN VAN A", "MALE", "VIET NAM", "HA NOI", "2021-01-01", "2046-01-01", "jwe");

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

    static final LegalIdentity IDENTITY =
            new LegalIdentity(HOLDER.legalName(), HASHER.hash(HOLDER.idNumber()), 1, MASKED);

    private final NfcSessionId session = NfcSessionId.generate();
    private final NfcApi nfcApi = mock(NfcApi.class);
    private final CompleteKyc completeKyc = mock(CompleteKyc.class);
    private final KycEvents events = mock(KycEvents.class);
    private final SubmitKycCard submitKycCard = new SubmitKycCard(
            nfcApi,
            completeKyc,
            HASHER,
            events,
            new TransactionTemplate(mock(PlatformTransactionManager.class)),
            new MovableClock(NOW));

    /** What the verdict answered, when nfc asked it. */
    private final AtomicReference<Optional<NfcReasonCode>> verdict = new AtomicReference<>();

    @Test
    void cardIsSavedAsTheLegalIdentityWithItsEvent() {
        when(completeKyc.handle(OWNER, IDENTITY)).thenReturn(KycCompletion.COMPLETED);
        nfcJudges(answer -> answer.isEmpty() ? CardCheck.verified() : null);

        assertEquals(CardCheck.Result.VERIFIED, submit().result());
        assertEquals(Optional.empty(), verdict.get());
        verify(events).verified(OWNER, session, MASKED, NOW);
    }

    @Test
    void numberOfAnotherAccountIsRejectedWithAReasonThatCounts() {
        when(completeKyc.handle(OWNER, IDENTITY)).thenReturn(KycCompletion.ID_NUMBER_TAKEN);
        nfcJudges(answer -> CardCheck.rejected(answer.orElseThrow(), 4, null));

        submit();

        assertEquals(Optional.of(NfcReasonCode.ID_ALREADY_LINKED), verdict.get());
        verify(events).failed(OWNER, session, NfcReasonCode.ID_ALREADY_LINKED, 4, NOW);
    }

    @Test
    void parallelCardOfTheSameAccountThatWonIsSessionUsed() {
        when(completeKyc.handle(OWNER, IDENTITY)).thenReturn(KycCompletion.ALREADY_COMPLETED);
        nfcJudges(answer -> CardCheck.rejected(answer.orElseThrow()));

        submit();

        assertEquals(Optional.of(NfcReasonCode.SESSION_USED), verdict.get());
        verifyNoInteractions(events);
    }

    @Test
    void cardThatLocksIsReportedAsLocked() {
        Instant lockedUntil = NOW.plusSeconds(900);
        when(nfcApi.check(eq(session), eq(OWNER), eq(CARD), any()))
                .thenReturn(CardCheck.rejected(NfcReasonCode.BAD_FORMAT, 0, lockedUntil));

        submit();

        verify(events).locked(OWNER, session, NfcReasonCode.BAD_FORMAT, lockedUntil, NOW);
    }

    @Test
    void rejectionThatDidNotCountIsNotReported() {
        when(nfcApi.check(eq(session), eq(OWNER), eq(CARD), any()))
                .thenReturn(CardCheck.rejected(NfcReasonCode.LOCKED, 0, NOW.plusSeconds(600)));

        submit();

        verifyNoInteractions(events);
    }

    @Test
    void uniqueKeyRaceIsAnsweredAsIdAlreadyLinked() {
        when(completeKyc.handle(OWNER, IDENTITY)).thenThrow(new IdNumberTakenMeanwhile(null));
        nfcJudges(answer -> CardCheck.verified());

        CardCheck check = submit();

        assertEquals(NfcReasonCode.ID_ALREADY_LINKED, check.reasonCode());
        assertNull(check.attemptsLeft());
        verifyNoInteractions(events);
    }

    /** nfc hands HOLDER to the verdict and ends the card as {@code ending} says from the verdict's answer. */
    private void nfcJudges(Function<Optional<NfcReasonCode>, CardCheck> ending) {
        when(nfcApi.check(eq(session), eq(OWNER), eq(CARD), any())).thenAnswer(invocation -> {
            CardVerdict judge = invocation.getArgument(3);
            verdict.set(judge.judge(HOLDER));
            return ending.apply(verdict.get());
        });
    }

    private CardCheck submit() {
        return submitKycCard.handle(session, OWNER, CARD);
    }
}
