package com.moonkage.identity.kyc.infrastructure.messaging;

import com.moonkage.identity.kyc.application.port.KycEvents;
import com.moonkage.identity.kyc.domain.KycReasonCode;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.platform.messaging.outbox.Outbox;
import com.moonkage.identity.profile.MaskedIdNumber;
import com.moonkage.identity.shared.AccountId;
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
    public void failed(AccountId owner, NfcSessionId session, KycReasonCode reason, int attemptsLeft, Instant at) {
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
    public void locked(AccountId owner, NfcSessionId session, KycReasonCode reason, Instant lockedUntil, Instant at) {
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
