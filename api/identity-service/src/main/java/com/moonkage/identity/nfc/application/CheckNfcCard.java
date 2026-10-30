package com.moonkage.identity.nfc.application;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.CardHolder;
import com.moonkage.identity.nfc.CardVerdict;
import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor;
import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor.SealedCardFields;
import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;
import com.moonkage.identity.nfc.domain.NfcCard;
import com.moonkage.identity.nfc.domain.NfcCardFields;
import com.moonkage.identity.nfc.domain.NfcCardRules;
import com.moonkage.identity.nfc.domain.NfcLockout;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * AC-04.2 - AC-04.9: the app sends the card once; it is checked in Software Design 4.2 order (session, lockout, seal,
 * format, expiry, then the caller's verdict). A rejected card is an answer, never an error.
 *
 * <p>The card first claims its session, so two parallel cards cannot both run; the session is released whatever
 * happens. Attempts are counted in memory and are not undone by a rollback of the caller.
 */
@Service
@RequiredArgsConstructor
class CheckNfcCard {

    private final NfcSessionStore sessions;
    private final NfcAttemptStore attempts;
    private final CardPayloadDecryptor decryptor;
    private final NfcRules rules;
    private final Clock clock;

    CardCheck handle(NfcSessionId id, AccountId caller, SubmittedCard card, CardVerdict verdict) {
        Optional<NfcReasonCode> refusal = claim(id, caller);
        if (refusal.isPresent()) {
            return CardCheck.rejected(refusal.get());
        }
        boolean verified = false;
        try {
            CardCheck check = check(caller, card, verdict);
            verified = check.isVerified();
            return check;
        } finally {
            boolean released = verified;
            sessions.update(id, session -> session.released(released));
        }
    }

    /** Empty when the session is now claimed by this card; otherwise why it was refused. */
    private Optional<NfcReasonCode> claim(NfcSessionId id, AccountId caller) {
        Instant now = clock.instant();
        AtomicReference<NfcReasonCode> refusal = new AtomicReference<>(NfcReasonCode.SESSION_EXPIRED);
        sessions.update(id, session -> {
            Optional<NfcReasonCode> reason = session.refusalFor(caller, now);
            refusal.set(reason.orElse(null));
            return reason.isEmpty() ? session.claimed() : session;
        });
        return Optional.ofNullable(refusal.get());
    }

    private CardCheck check(AccountId owner, SubmittedCard submitted, CardVerdict verdict) {
        Instant now = clock.instant();
        NfcLockout lockout = attempts.lockoutOf(owner);
        if (lockout.isLocked(now)) {
            return CardCheck.rejected(NfcReasonCode.LOCKED, 0, lockout.lockedUntil());
        }

        Optional<NfcCard> read = decryptor
                .decrypt(submitted.sealedFields())
                .map(opened -> fields(submitted, opened))
                .flatMap(NfcCardRules::read);
        if (read.isEmpty()) {
            return countFailure(owner, NfcReasonCode.BAD_FORMAT, now);
        }
        NfcCard card = read.get();
        if (card.isExpiredAt(now)) {
            return countFailure(owner, NfcReasonCode.CARD_EXPIRED, now);
        }

        CardHolder holder = card.holder();
        Optional<NfcReasonCode> rejection = verdict.judge(holder);
        if (rejection.isEmpty()) {
            attempts.clear(owner);
            return CardCheck.verified();
        }
        NfcReasonCode reason = rejection.get();
        return reason.countsAsAttempt() ? countFailure(owner, reason, now) : CardCheck.rejected(reason);
    }

    /** AC-04.9: the last allowed attempt locks KYC for nfc.lockout-duration. */
    private CardCheck countFailure(AccountId owner, NfcReasonCode reason, Instant now) {
        NfcLockout counted = attempts.recordFailure(owner, rules, now);
        if (counted.isLocked(now)) {
            return CardCheck.rejected(reason, 0, counted.lockedUntil());
        }
        return CardCheck.rejected(reason, counted.attemptsLeft(rules), null);
    }

    private static NfcCardFields fields(SubmittedCard card, SealedCardFields opened) {
        return new NfcCardFields(
                opened.idNumber(),
                card.fullName(),
                card.gender(),
                card.nationality(),
                opened.dateOfBirth(),
                card.placeOfBirth(),
                opened.placeOfResidence(),
                card.dateOfIssue(),
                card.dateOfExpiry());
    }
}
