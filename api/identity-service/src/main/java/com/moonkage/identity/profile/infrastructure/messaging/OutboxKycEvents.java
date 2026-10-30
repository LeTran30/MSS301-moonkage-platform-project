package com.moonkage.identity.profile.infrastructure.messaging;

import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.platform.messaging.outbox.Outbox;
import com.moonkage.identity.profile.application.port.KycEvents;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.MaskedIdNumber;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * KYC events through the outbox, in the transaction of the outcome they report, so an event is never lost nor sent
 * for a rollback (Software Design 6). Consumed by orchestrator-service (web push, audit).
 */
@Component
@RequiredArgsConstructor
class OutboxKycEvents implements KycEvents {

    static final String VERIFIED = "account.kyc_verified";
    static final String FAILED = "account.kyc_failed";
    static final String LOCKED = "account.kyc_locked";

    private final Outbox outbox;

    @Override
    public void verified(AccountId owner, NfcSessionId session, MaskedIdNumber idNumber, Instant at) {
        outbox.enqueue(
                VERIFIED,
                eventId -> new KycVerificationEvent(
                        eventId.toString(),
                        KycVerificationEvent.Type.VERIFIED,
                        owner.toString(),
                        session.value(),
                        null,
                        null,
                        idNumber.value(),
                        null,
                        at));
    }

    @Override
    public void failed(AccountId owner, NfcSessionId session, NfcReasonCode reason, int attemptsLeft, Instant at) {
        outbox.enqueue(
                FAILED,
                eventId -> new KycVerificationEvent(
                        eventId.toString(),
                        KycVerificationEvent.Type.FAILED,
                        owner.toString(),
                        session.value(),
                        reason,
                        attemptsLeft,
                        null,
                        null,
                        at));
    }

    @Override
    public void locked(AccountId owner, NfcSessionId session, NfcReasonCode reason, Instant lockedUntil, Instant at) {
        outbox.enqueue(
                LOCKED,
                eventId -> new KycVerificationEvent(
                        eventId.toString(),
                        KycVerificationEvent.Type.LOCKED,
                        owner.toString(),
                        session.value(),
                        reason,
                        0,
                        null,
                        lockedUntil,
                        at));
    }
}
