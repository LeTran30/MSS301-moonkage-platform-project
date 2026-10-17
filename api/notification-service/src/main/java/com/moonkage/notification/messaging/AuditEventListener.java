package com.moonkage.notification.messaging;

import com.moonkage.notification.config.RabbitConfig;
import com.moonkage.notification.entity.AuditLog;
import com.moonkage.notification.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/** Stores every audit event published by the other services (NFR-07). */
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;

    @RabbitListener(queues = RabbitConfig.AUDIT_QUEUE)
    public void onAuditEvent(AuditEvent event) {
        AuditLog log = new AuditLog();
        log.setSourceService(event.sourceService());
        log.setActorAccountId(event.actorAccountId());
        log.setAction(event.action());
        log.setTargetType(event.targetType());
        log.setTargetId(event.targetId());
        log.setBeforeValue(event.beforeValue());
        log.setAfterValue(event.afterValue());
        log.setReason(event.reason());
        log.setOccurredAt(event.occurredAt());
        auditLogRepository.save(log);
    }
}
