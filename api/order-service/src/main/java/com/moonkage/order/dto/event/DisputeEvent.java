package com.moonkage.order.dto.event;

import java.time.Instant;

/**
 * Body of dispute.opened and dispute.resolved. payment-service keeps the money of the order while a dispute is open
 * (BR-18) and refunds {@code refundAmount} once resolved with a refund (FR-49).
 *
 * @param decision FULL_REFUND, PARTIAL_REFUND or REJECTED; null while open
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
