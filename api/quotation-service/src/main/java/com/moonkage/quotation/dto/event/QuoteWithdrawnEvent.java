package com.moonkage.quotation.dto.event;

import java.time.Instant;

/** quote.withdrawn: the buyer sees the quote as withdrawn (FR-17). */
public record QuoteWithdrawnEvent(
        String eventId, Instant occurredAt, String quoteId, String requestId, String buyerAccountId, String vendorId) {

    public static final String ROUTING_KEY = "quote.withdrawn";
}
