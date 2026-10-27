package com.moonkage.order.dto.response;

import java.time.Instant;

/**
 * @param paymentUrl the VNPay page; the buyer is sent there right away
 * @param expiresAt the stock is held until then (BR-28)
 */
public record CreateCheckoutResponse(
        String checkoutId, String paymentId, String paymentUrl, long totalAmount, Instant expiresAt) {}
