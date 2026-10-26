package com.moonkage.quotation.dto.event;

import com.moonkage.quotation.enums.RequestType;
import java.time.Instant;
import java.util.List;

/** request.created: orchestrator tells every invited vendor (FR-36). */
public record RequestCreatedEvent(
        String eventId,
        Instant occurredAt,
        String requestId,
        String buyerAccountId,
        RequestType type,
        List<String> invitedVendorIds) {

    public static final String ROUTING_KEY = "request.created";
}
