package com.moonkage.payment.enums;

/** Gateway result; DUPLICATE is a second success for the same purpose and reference, refunded (P-03). */
public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    DUPLICATE
}
