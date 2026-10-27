package com.moonkage.order.dto.response;

import java.time.Instant;

public record ReviewResponse(String reviewId, String productId, int rating, String content, Instant createdAt) {}
