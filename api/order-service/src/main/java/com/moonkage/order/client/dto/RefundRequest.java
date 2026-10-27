package com.moonkage.order.client.dto;

/**
 * Body of payment-service POST /internal/refunds.
 *
 * @param reason LATE_PAYMENT: a checkout paid after its stock was sold (P-01)
 */
public record RefundRequest(String paymentId, String reason, long amount) {

    public static final String LATE_PAYMENT = "LATE_PAYMENT";
}
