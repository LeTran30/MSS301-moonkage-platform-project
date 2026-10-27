package com.moonkage.order.client.dto;

import java.time.Instant;
import java.util.List;

/**
 * Body of payment-service POST /internal/payments.
 *
 * @param purpose CHECKOUT (referenceId = checkoutId) or REMAINDER (referenceId = orderId)
 * @param expiresAt vnp_ExpireDate; null takes payment-service's default
 * @param allocations CHECKOUT only: each order's share, ids issued with the checkout (BR-29)
 */
public record CreatePaymentRequest(
        String purpose,
        String referenceId,
        String payerAccountId,
        long amount,
        Instant expiresAt,
        List<Allocation> allocations) {

    public static final String CHECKOUT = "CHECKOUT";
    public static final String REMAINDER = "REMAINDER";

    public record Allocation(String orderId, long amount) {}
}
