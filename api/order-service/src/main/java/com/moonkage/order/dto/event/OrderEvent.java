package com.moonkage.order.dto.event;

import java.time.Instant;

/**
 * Body of order.created, order.status_changed, order.delivered and order.received_confirmed: the state payment-service
 * keeps in order_snapshots (payout eligibility) and orchestrator notifies on.
 *
 * @param complaintDeadline set from DELIVERED on (D-13)
 * @param sourceVersion the order's version after the change; a copy keeps the highest
 */
public record OrderEvent(
        String eventId,
        String orderId,
        String kind,
        String status,
        String buyerAccountId,
        String vendorId,
        long totalAmount,
        boolean interprovince,
        Instant complaintDeadline,
        boolean receivedConfirmed,
        long sourceVersion,
        Instant occurredAt) {}
