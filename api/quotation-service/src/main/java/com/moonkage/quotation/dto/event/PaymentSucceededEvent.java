package com.moonkage.quotation.dto.event;

import java.time.Instant;

/**
 * payment.succeeded as payment-service sends it. Every purpose arrives on the same routing key, so {@code purpose}
 * stays a string: a purpose quotation-service does not handle is ignored.
 *
 * @param referenceId the acceptanceId for DEPOSIT
 */
public record PaymentSucceededEvent(
        String eventId, String paymentId, String purpose, String referenceId, long amount, Instant paidAt) {}
