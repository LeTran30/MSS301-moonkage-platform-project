package com.moonkage.catalog.service.replay;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.CatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * review.created of order-service, an immutable fact (contract §7). order-service sends the event itself at the root,
 * without the v1 envelope (ReviewCreatedEvent there); this reads that shape.
 */
@Component
@RequiredArgsConstructor
public class ReviewCreatedAdapter implements ProjectionReplayAdapter {
    static final String ROUTING_KEY = "review.created";
    private static final String AGGREGATE_TYPE = "REVIEW";

    private final ProjectionEventReader reader;
    private final CatalogProjectionService projection;

    @Override
    public String routingKey() {
        return ROUTING_KEY;
    }

    @Override
    public ProjectionOutcome apply(InboxEntry storedEvent) {
        var envelope = reader.readEnvelope(storedEvent, AGGREGATE_TYPE);
        JsonNode event = envelope.data();
        var row = new ReviewProjectionRow(
                reader.requireAggregateId(envelope, "reviewId"),
                reader.requireText(event, "productId"),
                reader.requireText(event, "vendorId"),
                reader.requireInt(event, "rating"),
                reader.nullableText(event, "content"),
                reader.requireInstant(event, "createdAt"));
        return projection.applyReview(storedEvent.eventId(), row);
    }
}
