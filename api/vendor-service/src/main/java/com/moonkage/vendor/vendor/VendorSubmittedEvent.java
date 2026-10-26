package com.moonkage.vendor.vendor;

import java.time.Instant;
import java.util.UUID;

/**
 * vendor.submitted: a profile was submitted or resubmitted and waits for review (FR-26, AC-27.2). orchestrator-service
 * tells the admins and writes the audit log. No personal data: the owner check stays in vendor-service.
 */
public record VendorSubmittedEvent(
        String eventId, String vendorId, String ownerAccountId, int submissionNo, Instant occurredAt) {

    static VendorSubmittedEvent of(String vendorId, String ownerAccountId, int submissionNo, Instant occurredAt) {
        return new VendorSubmittedEvent(
                UUID.randomUUID().toString(), vendorId, ownerAccountId, submissionNo, occurredAt);
    }
}
