package com.moonkage.payment.client.dto;

import java.time.Instant;

/** order-service POST /internal/orders/{orderId}/payout-lock (P-02). */
public record PayoutLockResponse(String orderId, Instant payoutLockedAt) {}
