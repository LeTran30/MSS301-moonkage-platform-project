package com.moonkage.orchestrator.channel.nfc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.moonkage.orchestrator.application.port.AuditLogRepository;
import com.moonkage.orchestrator.application.port.RealtimeDestination;
import com.moonkage.orchestrator.application.port.RealtimePublisher;
import com.moonkage.orchestrator.channel.nfc.NfcVerificationEventHandler.NfcResultMessage;
import com.moonkage.orchestrator.contract.NfcVerificationEvent;
import com.moonkage.orchestrator.domain.AuditLog;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class NfcVerificationEventHandlerTest {

    private static final Instant AT = Instant.parse("2026-10-19T10:00:00Z");

    private final RealtimePublisher publisher = mock(RealtimePublisher.class);
    private final AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
    private final NfcVerificationEventHandler handler = new NfcVerificationEventHandler(publisher, auditLogRepository);

    @Test
    @DisplayName("a failed attempt is pushed to the account's NFC queue without any card data, and audited")
    void failedAttemptIsPushedAndAudited() {
        handler.handle(
                new NfcVerificationEvent("evt-1", "FAILED", "acc-1", "session-1", "CARD_EXPIRED", 3, null, null, AT));

        ArgumentCaptor<Object> pushed = ArgumentCaptor.forClass(Object.class);
        verify(publisher).publishToUser(eq("acc-1"), eq(RealtimeDestination.NFC), pushed.capture());
        assertThat(pushed.getValue())
                .isEqualTo(new NfcResultMessage("FAILED", "session-1", "CARD_EXPIRED", 3, null, AT));

        AuditLog entry = savedAudit();
        assertThat(entry.getAction()).isEqualTo("NFC_FAILED");
        assertThat(entry.getActorAccountId()).isEqualTo("acc-1");
        assertThat(entry.getTargetId()).isEqualTo("acc-1");
        assertThat(entry.getReason()).isEqualTo("CARD_EXPIRED");
        assertThat(entry.getOccurredAt()).isEqualTo(AT);
    }

    @Test
    @DisplayName("the masked ID number of a verified card is not pushed to the browser")
    void verifiedPushHasNoIdNumber() {
        handler.handle(new NfcVerificationEvent(
                "evt-2", "VERIFIED", "acc-1", "session-1", null, null, "********6789", null, AT));

        ArgumentCaptor<Object> pushed = ArgumentCaptor.forClass(Object.class);
        verify(publisher).publishToUser(eq("acc-1"), eq(RealtimeDestination.NFC), pushed.capture());
        assertThat(pushed.getValue().toString()).doesNotContain("6789");
        assertThat(savedAudit().getAction()).isEqualTo("NFC_VERIFIED");
    }

    @Test
    @DisplayName("a lockout keeps its end in the audit entry")
    void lockoutIsAuditedWithItsEnd() {
        Instant lockedUntil = AT.plusSeconds(900);
        handler.handle(new NfcVerificationEvent(
                "evt-3", "LOCKED", "acc-1", "session-1", "BAD_FORMAT", 0, null, lockedUntil, AT));

        assertThat(savedAudit().getAfterValue()).isEqualTo("lockedUntil=" + lockedUntil);
    }

    @Test
    @DisplayName("an event without account is rejected, never pushed")
    void eventWithoutAccountIsRejected() {
        NfcVerificationEvent event = new NfcVerificationEvent("evt-4", "FAILED", null, "s", null, 4, null, null, AT);

        assertThatThrownBy(() -> handler.handle(event)).isInstanceOf(IllegalArgumentException.class);
        verify(publisher, never()).publishToUser(anyString(), anyString(), any());
    }

    private AuditLog savedAudit() {
        ArgumentCaptor<AuditLog> saved = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(saved.capture());
        AuditLog entry = saved.getValue();
        assertThat(entry.getSourceService()).isEqualTo("identity-service");
        assertThat(entry.getTargetType()).isEqualTo("ACCOUNT");
        return entry;
    }
}
