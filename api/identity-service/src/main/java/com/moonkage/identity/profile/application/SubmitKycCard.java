package com.moonkage.identity.profile.application;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.CardHolder;
import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.profile.application.port.IdNumberHasher;
import com.moonkage.identity.profile.application.port.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.application.port.KycEvents;
import com.moonkage.identity.profile.domain.LegalIdentity;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * FR-04: a card the app read by NFC becomes the legal identity of the profile, as an OTP becomes a verified account.
 * The nfc module checks the card; this decides what it proves (one number, one account: BR-23) and tells the rest of
 * the platform how it ended (Software Design 5.4). A verified card is saved with its event in one transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class SubmitKycCard {

    private final NfcApi nfcApi;
    private final CompleteKyc completeKyc;
    private final IdNumberHasher hasher;
    private final KycEvents events;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    CardCheck handle(NfcSessionId session, AccountId owner, SubmittedCard card) {
        CardCheck check;
        try {
            check = nfcApi.check(session, owner, card, holder -> judge(session, owner, holder));
        } catch (IdNumberTakenMeanwhile e) {
            // another account saved the same number in the same instant: the unique key caught it (BR-23)
            log.warn("KYC of account {} hit the ID number unique key", owner);
            return CardCheck.rejected(NfcReasonCode.ID_ALREADY_LINKED);
        }
        if (check.isCountedFailure()) {
            transactionTemplate.executeWithoutResult(status -> reportFailure(session, owner, check));
        }
        return check;
    }

    /** Saves what the card proved, with its event; empty when it was saved. */
    private Optional<NfcReasonCode> judge(NfcSessionId session, AccountId owner, CardHolder holder) {
        LegalIdentity identity = new LegalIdentity(
                holder.legalName(),
                hasher.hash(holder.idNumber()),
                hasher.keyVersion(),
                holder.idNumber().masked());
        return transactionTemplate.execute(status -> switch (completeKyc.handle(owner, identity)) {
            case COMPLETED -> {
                events.verified(owner, session, identity.idNumberMasked(), clock.instant());
                yield Optional.empty();
            }
            case ALREADY_COMPLETED -> Optional.of(NfcReasonCode.SESSION_USED);
            case ID_NUMBER_TAKEN -> Optional.of(NfcReasonCode.ID_ALREADY_LINKED);
        });
    }

    private void reportFailure(NfcSessionId session, AccountId owner, CardCheck check) {
        if (check.isLocked()) {
            events.locked(owner, session, check.reasonCode(), check.lockedUntil(), clock.instant());
        } else {
            events.failed(owner, session, check.reasonCode(), check.attemptsLeft(), clock.instant());
        }
    }
}
