package com.moonkage.catalog.messaging;

import java.time.Instant;

/**
 * One audit entry (NFR-07), stored by notification-service. Mirror of notification-service AuditEvent:
 * keep both in sync until the services share a contracts module.
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
