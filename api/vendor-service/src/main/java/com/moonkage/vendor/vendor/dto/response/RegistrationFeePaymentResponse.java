package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;

/** The registration fee the vendor paid (BR-31, AC-53.2): at most one per vendor. */
public record RegistrationFeePaymentResponse(String paymentId, long amount, Instant paidAt) {}
