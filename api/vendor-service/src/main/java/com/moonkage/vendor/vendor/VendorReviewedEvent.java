package com.moonkage.vendor.vendor;

import java.time.Instant;
import java.util.UUID;

/**
 * vendor.reviewed: an admin decided a profile (FR-45). orchestrator-service notifies the owner with the decision and
 * reason (AC-45.3) and writes the audit log.
 */
public record VendorReviewedEvent(
        String eventId,
        String vendorId,
        String ownerAccountId,
        String adminAccountId,
        ReviewDecision decision,
        String reason,
        Instant occurredAt) {

    static VendorReviewedEvent of(Vendor vendor, VendorReview review, Instant occurredAt) {
        return new VendorReviewedEvent(
                UUID.randomUUID().toString(),
                vendor.getId(),
                vendor.getOwnerAccountId(),
                review.getAdminAccountId(),
                review.getDecision(),
                review.getReason(),
                occurredAt);
    }
}
