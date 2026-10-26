package com.moonkage.quotation.dto.event;

import java.time.Instant;

/** request.declined: the buyer is told, with the reason (AC-36.3). */
public record RequestDeclinedEvent(
        String eventId,
        Instant occurredAt,
        String requestId,
        String buyerAccountId,
        String vendorId,
        String declineReason) {

    public static final String ROUTING_KEY = "request.declined";
}
