package com.moonkage.orchestrator.channel.nfc;

import com.moonkage.orchestrator.application.port.AuditLogRepository;
import com.moonkage.orchestrator.application.port.EventHandler;
import com.moonkage.orchestrator.application.port.RealtimeDestination;
import com.moonkage.orchestrator.application.port.RealtimePublisher;
import com.moonkage.orchestrator.contract.EventType;
import com.moonkage.orchestrator.contract.NfcVerificationEvent;
import com.moonkage.orchestrator.domain.AuditLog;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * FR-04 outcomes from identity-service: pushes each card attempt to the account's open pages, so the web leaves the
 * QR step without waiting for its poll (AC-04.5), and keeps an audit entry of every attempt (NFR-07).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NfcVerificationEventHandler implements EventHandler<NfcVerificationEvent> {

    static final String SOURCE_SERVICE = "identity-service";
    static final String ACTION_PREFIX = "NFC_";
    static final String TARGET_TYPE = "ACCOUNT";

    private final RealtimePublisher realtimePublisher;
    private final AuditLogRepository auditLogRepository;

    @Override
    public EventType supports() {
        return EventType.NFC_VERIFICATION;
    }

    @Override
    public void handle(NfcVerificationEvent event) {
        if (isBlank(event.accountId()) || isBlank(event.type())) {
            throw new IllegalArgumentException("accountId and type are required for NFC event " + event.eventId());
        }
        auditLogRepository.save(auditEntry(event));
        realtimePublisher.publishToUser(event.accountId(), RealtimeDestination.NFC, NfcResultMessage.from(event));
        log.info("NFC {} of account {} audited and pushed", event.type(), event.accountId());
    }

    private static AuditLog auditEntry(NfcVerificationEvent event) {
        AuditLog entry = new AuditLog();
        entry.setSourceService(SOURCE_SERVICE);
        entry.setActorAccountId(event.accountId());
        entry.setAction(ACTION_PREFIX + event.type());
        entry.setTargetType(TARGET_TYPE);
        entry.setTargetId(event.accountId());
        entry.setReason(event.reasonCode());
        entry.setAfterValue(event.lockedUntil() != null ? "lockedUntil=" + event.lockedUntil() : null);
        entry.setOccurredAt(event.occurredAt() != null ? event.occurredAt() : Instant.now());
        return entry;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** What the web receives on {@code /user/queue/nfc}: no ID card data, not even masked. */
    public record NfcResultMessage(
            String type,
            String sessionId,
            String reasonCode,
            Integer attemptsLeft,
            Instant lockedUntil,
            Instant occurredAt) {

        static NfcResultMessage from(NfcVerificationEvent event) {
            return new NfcResultMessage(
                    event.type(),
                    event.sessionId(),
                    event.reasonCode(),
                    event.attemptsLeft(),
                    event.lockedUntil(),
                    event.occurredAt());
        }
    }
}
