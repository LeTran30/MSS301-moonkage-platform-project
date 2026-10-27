package com.moonkage.payment.dto.response;

import java.time.Instant;

/** FR-48: what went to the vendor, once per order (A-12: bookkeeping only). */
public record PayoutResponse(String payoutId, String orderId, String vendorId, long amount, Instant createdAt) {}
