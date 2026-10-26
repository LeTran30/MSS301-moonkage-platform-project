package com.moonkage.catalog.dto.response;

import java.time.Instant;

public record ProductReviewResponse(String reviewId, int rating, String content, Instant createdAt) {}
