package com.moonkage.identity.kyc.infrastructure.messaging;

import com.moonkage.identity.kyc.domain.KycReasonCode;
import java.time.Instant;

/**
 * Outcome of one card, published as {@code account.nfc_verified / nfc_failed / nfc_locked}. Masked data only (Software
 * Design 8); {@code sessionId} lets the web match the push to the QR it shows (AC-04.5), {@code attemptsLeft} lets it
 * say how many tries remain. orchestrator-service keeps a mirror of this record: the payload does not change.
 */
public record KycVerificationEvent(
        String eventId,
        Type type,
        String accountId,
        String sessionId,
        KycReasonCode reasonCode,
        Integer attemptsLeft,
        String idNumberMasked,
        Instant lockedUntil,
        Instant occurredAt) {

    /** The names are sent as they are. */
    public enum Type {
        VERIFIED,
        FAILED,
        LOCKED
    }
}
