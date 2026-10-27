package com.moonkage.order.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** FR-11: one review per product of a delivered buy-now order (BR-32). */
public record CreateReviewRequest(
        @NotBlank @Size(max = 36) String productId,
        @Min(1) @Max(5) int rating,
        @Size(max = 2000) String content) {}
