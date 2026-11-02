package com.moonkage.order.dto.event;

import java.time.Instant;

/**
 * Data of review.created for catalog-service's product reviews and rating (ReviewProjectionRow there), sent in an
 * {@link EventEnvelope} with aggregateType REVIEW and aggregateId = reviewId.
 */
public record ReviewCreatedEvent(
        String reviewId,
        String productId,
        String vendorId,
        String orderId,
        int rating,
        String content,
        Instant createdAt) {

    /** A review never changes after it is written (contract catalog v1, section 7), so its only version is 1. */
    public static final long SOURCE_VERSION = 1;
}
