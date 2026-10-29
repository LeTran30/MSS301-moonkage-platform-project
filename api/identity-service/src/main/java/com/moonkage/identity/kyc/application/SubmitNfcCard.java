package com.moonkage.identity.kyc.application;

import com.moonkage.identity.kyc.application.port.CardPayloadDecryptor;
import com.moonkage.identity.kyc.application.port.CardPayloadDecryptor.SealedCardFields;
import com.moonkage.identity.kyc.application.port.IdNumberHasher;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.KycEvents;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;
import com.moonkage.identity.kyc.domain.KycLockout;
import com.moonkage.identity.kyc.domain.KycReasonCode;
import com.moonkage.identity.kyc.domain.KycResult;
import com.moonkage.identity.kyc.domain.KycRules;
import com.moonkage.identity.kyc.domain.nfc.NfcCard;
import com.moonkage.identity.kyc.domain.nfc.NfcCardFields;
import com.moonkage.identity.kyc.domain.nfc.NfcCardRules;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.profile.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * AC-04.2 - AC-04.9: the app sends the card once; the server checks it in Software Design 4.2 order (session,
 * lockout, seal, format, expiry, number not linked elsewhere) and saves the outcome with its event in one
 * transaction. A rejected card is an answer, never an error.
 *
 * <p>The card first claims its session, so two parallel cards cannot both run; the session is released whatever
 * happens. Attempts are counted in memory and are not undone by a rollback, as before.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmitNfcCard {

    private final NfcSessionStore sessions;
    private final KycAttemptStore attempts;
    private final CardPayloadDecryptor decryptor;
    private final IdNumberHasher hasher;
    private final ProfileApi profileApi;
    private final KycEvents events;
    private final KycRules rules;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public Outcome handle(Command command) {
        Optional<KycReasonCode> refusal = claim(command.session(), command.owner());
        if (refusal.isPresent()) {
            return Outcome.rejected(refusal.get());
        }
        boolean verified = false;
        try {
            Outcome outcome = transactionTemplate.execute(status -> check(command));
            verified = outcome.result() == KycResult.VERIFIED;
            return outcome;
        } catch (IdNumberTakenMeanwhile e) {
            // another account saved the same number in the same instant: the unique key caught it (BR-23)
            log.warn("KYC of account {} hit the ID number unique key", command.owner());
            return Outcome.rejected(KycReasonCode.ID_ALREADY_LINKED);
        } finally {
            boolean released = verified;
            sessions.update(command.session(), session -> session.released(released));
        }
    }

    /** Empty when the session is now claimed by this card; otherwise why it was refused. */
    private Optional<KycReasonCode> claim(NfcSessionId id, AccountId caller) {
        Instant now = clock.instant();
        AtomicReference<KycReasonCode> refusal = new AtomicReference<>(KycReasonCode.SESSION_EXPIRED);
        sessions.update(id, session -> {
            Optional<KycReasonCode> reason = session.refusalFor(caller, now);
            refusal.set(reason.orElse(null));
            return reason.isEmpty() ? session.claimed() : session;
        });
        return Optional.ofNullable(refusal.get());
    }

    private Outcome check(Command command) {
        Instant now = clock.instant();
        AccountId owner = command.owner();
        if (profileApi.findKyc(owner).isPresent()) {
            return Outcome.rejected(KycReasonCode.SESSION_USED);
        }
        KycLockout lockout = attempts.lockoutOf(owner);
        if (lockout.isLocked(now)) {
            return Outcome.rejected(KycReasonCode.LOCKED, 0, lockout.lockedUntil());
        }

        Optional<NfcCard> read = decryptor
                .decrypt(command.sealedFields())
                .map(command::cardFields)
                .flatMap(NfcCardRules::read);
        if (read.isEmpty()) {
            return countFailure(command, KycReasonCode.BAD_FORMAT, now);
        }
        NfcCard card = read.get();
        if (card.isExpiredAt(now)) {
            return countFailure(command, KycReasonCode.CARD_EXPIRED, now);
        }

        LegalIdentity identity = new LegalIdentity(
                card.legalName(),
                hasher.hash(card.idNumber()),
                hasher.keyVersion(),
                card.idNumber().masked());
        return switch (profileApi.completeKyc(owner, identity)) {
            case COMPLETED -> {
                attempts.clear(owner);
                events.verified(owner, command.session(), identity.idNumberMasked(), now);
                yield Outcome.verified();
            }
            case ALREADY_COMPLETED -> Outcome.rejected(KycReasonCode.SESSION_USED);
            case ID_NUMBER_TAKEN -> countFailure(command, KycReasonCode.ID_ALREADY_LINKED, now);
        };
    }

    /** AC-04.9: the last allowed attempt locks KYC for nfc.lockout-duration. */
    private Outcome countFailure(Command command, KycReasonCode reason, Instant now) {
        KycLockout counted = attempts.recordFailure(command.owner(), rules, now);
        if (counted.isLocked(now)) {
            events.locked(command.owner(), command.session(), reason, counted.lockedUntil(), now);
            return Outcome.rejected(reason, 0, counted.lockedUntil());
        }
        int attemptsLeft = counted.attemptsLeft(rules);
        events.failed(command.owner(), command.session(), reason, attemptsLeft, now);
        return Outcome.rejected(reason, attemptsLeft, null);
    }

    /**
     * One card as the app sent it: six fields in plain text, three sealed (D-17). Nothing is trusted yet.
     *
     * @param sealedFields the sealed idNumber, dateOfBirth and placeOfResidence
     */
    public record Command(
            NfcSessionId session,
            AccountId owner,
            String fullName,
            String gender,
            String nationality,
            String placeOfBirth,
            String dateOfIssue,
            String dateOfExpiry,
            String sealedFields) {

        NfcCardFields cardFields(SealedCardFields sealed) {
            return new NfcCardFields(
                    sealed.idNumber(),
                    fullName,
                    gender,
                    nationality,
                    sealed.dateOfBirth(),
                    placeOfBirth,
                    sealed.placeOfResidence(),
                    dateOfIssue,
                    dateOfExpiry);
        }
    }

    /**
     * How one card ended.
     *
     * @param attemptsLeft null when the card did not count as an attempt
     * @param lockedUntil set when this card locked KYC or found it locked
     */
    public record Outcome(KycResult result, KycReasonCode reasonCode, Integer attemptsLeft, Instant lockedUntil) {

        static Outcome verified() {
            return new Outcome(KycResult.VERIFIED, null, null, null);
        }

        static Outcome rejected(KycReasonCode reason) {
            return new Outcome(KycResult.REJECTED, reason, null, null);
        }

        static Outcome rejected(KycReasonCode reason, int attemptsLeft, Instant lockedUntil) {
            return new Outcome(KycResult.REJECTED, reason, attemptsLeft, lockedUntil);
        }
    }
}
