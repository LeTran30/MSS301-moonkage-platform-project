package com.moonkage.vendor.client.dto;

/** payments.purpose of payment-service; vendor-service creates and handles REGISTRATION_FEE only. */
public enum PaymentPurpose {
    CHECKOUT,
    DEPOSIT,
    REMAINDER,
    REGISTRATION_FEE
}
