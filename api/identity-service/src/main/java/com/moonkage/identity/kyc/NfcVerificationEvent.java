package com.moonkage.identity.kyc;

import java.time.Instant;

/**
 * Outcome of one NFC card attempt, published as {@code account.nfc_verified / nfc_failed / nfc_locked}. Masked data
 * only (Software Design 8); {@code sessionId} lets the web match the push to the QR it shows (AC-04.5), and
 * {@code attemptsLeft} lets it say how many tries remain. orchestrator-service keeps a mirror of this record.
 */
public record NfcVerificationEvent(
        String eventId,
        Type type,
        String accountId,
        String sessionId,
        NfcReasonCode reasonCode,
        Integer attemptsLeft,
        String idNumberMasked,
        Instant lockedUntil,
        Instant occurredAt) {

    public enum Type {
        // FR-04 (Software Design 5.4): web push and audit, consumed by orchestrator-service
        VERIFIED("account.nfc_verified"),
        FAILED("account.nfc_failed"),
        LOCKED("account.nfc_locked");

        private final String routingKey;

        Type(String routingKey) {
            this.routingKey = routingKey;
        }

        public String routingKey() {
            return routingKey;
        }
    }

    public static NfcVerificationEvent verified(
            String eventId, String accountId, String sessionId, String idNumberMasked, Instant at) {
        return new NfcVerificationEvent(
                eventId, Type.VERIFIED, accountId, sessionId, null, null, idNumberMasked, null, at);
    }

    public static NfcVerificationEvent failed(
            String eventId, String accountId, String sessionId, NfcReasonCode reason, int attemptsLeft, Instant at) {
        return new NfcVerificationEvent(
                eventId, Type.FAILED, accountId, sessionId, reason, attemptsLeft, null, null, at);
    }

    public static NfcVerificationEvent locked(
            String eventId, String accountId, String sessionId, NfcReasonCode reason, Instant lockedUntil, Instant at) {
        return new NfcVerificationEvent(eventId, Type.LOCKED, accountId, sessionId, reason, 0, null, lockedUntil, at);
    }
}
