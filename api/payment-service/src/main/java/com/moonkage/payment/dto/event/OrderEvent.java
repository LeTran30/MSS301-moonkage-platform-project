package com.moonkage.payment.dto.event;

import java.time.Instant;

/** order.created, order.status_changed, order.delivered, order.received_confirmed as order-service sends them. */
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
