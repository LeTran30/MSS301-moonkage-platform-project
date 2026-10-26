package com.moonkage.payment.enums;

/** refunds.status (AC-49.3). */
public enum RefundStatus {
    PENDING,
    SUCCEEDED,
    /** The gateway refused or failed; an admin refunds by hand and marks it done. */
    MANUAL_REQUIRED
}
