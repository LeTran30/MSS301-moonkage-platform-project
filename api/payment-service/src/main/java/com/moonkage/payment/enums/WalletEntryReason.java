package com.moonkage.payment.enums;

/** wallet_entries.reason; with reference_id it is unique, so a redelivered event moves money once. */
public enum WalletEntryReason {
    /** A Shop rejected a paid order; reference = orderId (Q-01). */
    ORDER_REJECTED,
    /** A checkout paid from the wallet; reference = paymentId. */
    PAYMENT
}
