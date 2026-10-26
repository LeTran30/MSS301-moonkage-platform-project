package com.moonkage.quotation.dto.event;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.time.Instant;

/**
 * quote.accepted: the deposit succeeded. order-service creates the custom order from {@code snapshot} without calling
 * quotation back and keeps {@code acceptanceId}, {@code contentHash} as agreement_id, agreement_hash (L-10 step 6).
 */
public record QuoteAcceptedEvent(
        String eventId,
        Instant occurredAt,
        String acceptanceId,
        String quoteId,
        String requestId,
        String buyerAccountId,
        String vendorId,
        long depositAmount,
        String paymentId,
        String contentHash,
        @JsonRawValue String snapshot) {

    public static final String ROUTING_KEY = "quote.accepted";
}
