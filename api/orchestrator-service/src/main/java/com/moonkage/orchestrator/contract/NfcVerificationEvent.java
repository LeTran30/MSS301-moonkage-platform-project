package com.moonkage.orchestrator.contract;

import java.time.Instant;

/**
 * Outcome of one NFC card attempt from identity-service ({@code account.kyc_verified / kyc_failed / kyc_locked}).
 * Mirror of identity-service {@code NfcVerificationEvent}: keep them in sync until the services share a contracts
 * module. Masked data only (Software Design 8).
 *
 * @param type VERIFIED, FAILED or LOCKED
 * @param reasonCode why the card was refused (FAILED, LOCKED), e.g. CARD_EXPIRED
 * @param attemptsLeft tries before the lockout (FAILED); 0 when LOCKED
 */
public record NfcVerificationEvent(
        String eventId,
        String type,
        String accountId,
        String sessionId,
        String reasonCode,
        Integer attemptsLeft,
        String idNumberMasked,
        Instant lockedUntil,
        Instant occurredAt)
        implements BaseEvent {

    @Override
    public EventType eventType() {
        return EventType.NFC_VERIFICATION;
    }
}
