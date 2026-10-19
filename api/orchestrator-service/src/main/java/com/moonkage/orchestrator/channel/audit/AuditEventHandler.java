package com.moonkage.orchestrator.channel.audit;

import com.moonkage.orchestrator.application.port.AuditLogRepository;
import com.moonkage.orchestrator.application.port.EventHandler;
import com.moonkage.orchestrator.contract.AuditEvent;
import com.moonkage.orchestrator.contract.EventType;
import com.moonkage.orchestrator.domain.AuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Channel handler dedicated to processing AUDIT events (NFR-07):
 * stores every immutable audit trail entry received from platform services.
 */
@Component
@RequiredArgsConstructor
public class AuditEventHandler implements EventHandler<AuditEvent> {

    private final AuditLogRepository auditLogRepository;

    @Override
    public EventType supports() {
        return EventType.AUDIT;
    }

    @Override
    public void handle(AuditEvent event) {
        AuditLog logEntry = new AuditLog();
        logEntry.setSourceService(event.sourceService());
        logEntry.setActorAccountId(event.actorAccountId());
        logEntry.setAction(event.action());
        logEntry.setTargetType(event.targetType());
        logEntry.setTargetId(event.targetId());
        logEntry.setBeforeValue(event.beforeValue());
        logEntry.setAfterValue(event.afterValue());
        logEntry.setReason(event.reason());
        logEntry.setOccurredAt(event.occurredAt());
        auditLogRepository.save(logEntry);
    }
}
