package com.moonkage.order.dto.request;

import com.moonkage.order.enums.MockupReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * FR-20: the buyer approves a mockup version or asks for changes.
 *
 * @param reviewStatus APPROVED or CHANGES_REQUESTED
 * @param reviewNote required with CHANGES_REQUESTED
 */
public record ReviewMockupRequest(
        @NotNull MockupReviewStatus reviewStatus,
        @Size(max = 2000) String reviewNote) {}
