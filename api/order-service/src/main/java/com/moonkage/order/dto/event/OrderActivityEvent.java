package com.moonkage.order.dto.event;

import java.time.Instant;

/**
 * Body of mockup.uploaded, mockup.reviewed and invoice.attached: who should be told about which order (orchestrator
 * notifies, NFR-10).
 *
 * @param versionNo the mockup version; null for invoice.attached
 * @param reviewStatus the mockup's review status; null for invoice.attached
 */
public record OrderActivityEvent(
        String eventId,
        String orderId,
        String vendorId,
        String buyerAccountId,
        Integer versionNo,
        String reviewStatus,
        Instant occurredAt) {}
