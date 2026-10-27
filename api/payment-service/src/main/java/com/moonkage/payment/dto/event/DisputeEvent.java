package com.moonkage.payment.dto.event;

import java.time.Instant;

/**
 * dispute.opened and dispute.resolved as order-service sends them.
 *
 * @param refundAmount whole VND to give back; null when rejected or open
 */
public record DisputeEvent(
        String eventId,
        String disputeId,
        String orderId,
        String vendorId,
        String buyerAccountId,
        String reason,
        String status,
        String decision,
        Long refundAmount,
        String decidedBy,
        Instant occurredAt) {}
