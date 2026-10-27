package com.moonkage.payment.enums;

/** refunds.reason (P-01, P-03). */
public enum RefundReason {
    /** Admin decision on a dispute (FR-49); the only reason tied to an order. */
    DISPUTE,
    /** A checkout paid after its stock went back and could not be held again (P-01). */
    LATE_PAYMENT,
    /** A second successful payment for the same purpose and reference (P-03). */
    DUPLICATE_PAYMENT,
    /** A deposit paid after the quote ran out (FR-19). */
    QUOTE_EXPIRED
}
