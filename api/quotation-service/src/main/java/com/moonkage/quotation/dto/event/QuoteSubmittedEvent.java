package com.moonkage.quotation.dto.event;

import java.time.Instant;

/** quote.submitted: the buyer is told a quote (or a new revision) arrived. */
public record QuoteSubmittedEvent(
        String eventId,
        Instant occurredAt,
        String quoteId,
        String requestId,
        String buyerAccountId,
        String vendorId,
        int revisionNo,
        long totalAmount,
        Instant validUntil) {

    public static final String ROUTING_KEY = "quote.submitted";
}
