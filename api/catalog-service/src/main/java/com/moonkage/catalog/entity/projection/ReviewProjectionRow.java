package com.moonkage.catalog.entity.projection;

import java.time.Instant;
import java.util.Objects;

public record ReviewProjectionRow(
        String reviewId, String productId, String vendorId, int rating, String content, Instant createdAt) {
    private static final int MAX_RATING = 5;

    public ReviewProjectionRow {
        ProjectionRowValidation.requireId(reviewId);
        ProjectionRowValidation.requireId(productId);
        ProjectionRowValidation.requireId(vendorId);
        Objects.requireNonNull(createdAt);
        if (rating < 1 || rating > MAX_RATING) {
            throw new IllegalArgumentException("Invalid review rating");
        }
    }
}
