package com.moonkage.order.dto.event;

import java.time.Instant;

/**
 * payment.succeeded as payment-service sends it. Every purpose arrives on the same routing key, so {@code purpose}
 * stays a string: one order-service does not handle is ignored.
 *
 * @param referenceId the checkoutId for CHECKOUT, the orderId for REMAINDER
 */
public record PaymentSucceededEvent(
        String eventId, String paymentId, String purpose, String referenceId, long amount, Instant paidAt) {}
