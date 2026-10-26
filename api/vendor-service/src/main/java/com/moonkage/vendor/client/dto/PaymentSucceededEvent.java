package com.moonkage.vendor.client.dto;

import java.time.Instant;

/**
 * payment.succeeded as payment-service sends it (payment.md, "Sự kiện"). Every purpose arrives on the same routing
 * key, so {@code purpose} stays a string: one vendor-service does not know is ignored, not a failed message.
 *
 * @param referenceId the vendorId when {@code purpose = REGISTRATION_FEE}
 * @param amount whole VND actually paid
 */
public record PaymentSucceededEvent(
        String eventId, String paymentId, String purpose, String referenceId, long amount, Instant paidAt) {

    public boolean isFor(PaymentPurpose expected) {
        return expected.name().equals(purpose);
    }
}
