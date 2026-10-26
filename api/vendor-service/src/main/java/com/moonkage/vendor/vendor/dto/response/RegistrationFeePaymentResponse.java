package com.moonkage.vendor.vendor.dto.response;

/** AC-27.4, AC-53.3. */
public record RegistrationFeePaymentResponse(String paymentId, long amount, String paymentUrl) {}
