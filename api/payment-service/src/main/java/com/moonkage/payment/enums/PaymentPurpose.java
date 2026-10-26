package com.moonkage.payment.enums;

/** What a payment is for; the root that owns it creates it (payments.purpose). */
public enum PaymentPurpose {
    /** Buy-now checkout of one or more orders (BR-29); referenceId is the checkoutId. */
    CHECKOUT,
    /** Quote deposit (FR-19); referenceId is the acceptanceId. */
    DEPOSIT,
    /** Rest of a quoted order; referenceId is the orderId. */
    REMAINDER,
    /** Vendor registration fee (BR-31); referenceId is the vendorId. */
    REGISTRATION_FEE
}
