package com.moonkage.identity.messaging;

import com.moonkage.identity.config.RabbitConfig;
import com.moonkage.identity.enums.NfcReasonCode;
import java.time.Instant;
import java.util.UUID;

/**
 * Outcome of one NFC card attempt, published as {@code account.nfc_verified / nfc_failed / nfc_locked}. Masked data
 * only (Software Design 8); {@code sessionId} lets the web match the push to the QR it shows (AC-04.5).
 */
public record NfcVerificationEvent(
        String eventId,
        Type type,
        String accountId,
        String sessionId,
        NfcReasonCode reasonCode,
        String idNumberMasked,
        Instant lockedUntil,
        Instant occurredAt) {

    public enum Type {
        VERIFIED(RabbitConfig.NFC_VERIFIED_ROUTING_KEY),
        FAILED(RabbitConfig.NFC_FAILED_ROUTING_KEY),
        LOCKED(RabbitConfig.NFC_LOCKED_ROUTING_KEY);

        private final String routingKey;

        Type(String routingKey) {
            this.routingKey = routingKey;
        }

        public String routingKey() {
            return routingKey;
        }
    }

    public static NfcVerificationEvent verified(String accountId, String sessionId, String idNumberMasked, Instant at) {
        return new NfcVerificationEvent(newId(), Type.VERIFIED, accountId, sessionId, null, idNumberMasked, null, at);
    }

    public static NfcVerificationEvent failed(String accountId, String sessionId, NfcReasonCode reason, Instant at) {
        return new NfcVerificationEvent(newId(), Type.FAILED, accountId, sessionId, reason, null, null, at);
    }

    public static NfcVerificationEvent locked(
            String accountId, String sessionId, NfcReasonCode reason, Instant lockedUntil, Instant at) {
        return new NfcVerificationEvent(newId(), Type.LOCKED, accountId, sessionId, reason, null, lockedUntil, at);
    }

    private static String newId() {
        return UUID.randomUUID().toString();
    }
}
