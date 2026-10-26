package com.moonkage.order.enums;

/** checkouts.status (order.md, "Vòng đời checkout", P-01). */
public enum CheckoutStatus {
    PENDING_PAYMENT,
    /** Paid and the held stock committed: one order per Shop exists (BR-29). */
    SUCCEEDED,
    /** VNPay declined; the stock went back. */
    FAILED,
    /** Not paid before expires_at; the stock went back. */
    EXPIRED,
    /** Paid too late, the stock was sold meanwhile: the payment is refunded (LATE_PAYMENT). */
    REFUND_REQUESTED
}
