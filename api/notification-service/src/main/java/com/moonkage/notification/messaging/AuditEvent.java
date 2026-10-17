package com.moonkage.notification.messaging;

import java.time.Instant;

/**
 * One audit entry (NFR-07) sent by any service. The publishers keep a mirror of this record
 * (e.g. catalog-service AuditEvent): keep them in sync until the services share a contracts module.
 */
public record AuditEvent(
        String sourceService,
        String actorAccountId,
        String action,
        String targetType,
        String targetId,
        String beforeValue,
        String afterValue,
        String reason,
        Instant occurredAt) {}
