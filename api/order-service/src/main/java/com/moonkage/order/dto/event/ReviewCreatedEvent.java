package com.moonkage.order.dto.event;

import java.time.Instant;

/** review.created for catalog-service's product reviews and rating (ReviewProjectionRow there). */
public record ReviewCreatedEvent(
        String eventId,
        String reviewId,
        String productId,
        String vendorId,
        String orderId,
        int rating,
        String content,
        Instant createdAt) {}
