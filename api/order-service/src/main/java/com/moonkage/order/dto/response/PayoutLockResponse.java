package com.moonkage.order.dto.response;

import java.time.Instant;

/** POST /internal/orders/{orderId}/payout-lock (P-02). */
public record PayoutLockResponse(String orderId, Instant payoutLockedAt) {}
