package com.moonkage.payment.enums;

/** wallet_entries.reason; with reference_id it is unique, so a redelivered event moves money once. */
public enum WalletEntryReason {
    /** A Shop rejected a paid order; credit, reference = orderId (Q-01). */
    ORDER_REJECTED,
    /** A checkout paid from the wallet; debit, reference = paymentId. */
    PAYMENT,
    /** A refund of a payment made from the wallet (dispute, late payment); credit, reference = refundId. */
    REFUND,
    /** Money sent to the buyer's bank; debit when asked, reference = withdrawalId. */
    WITHDRAWAL,
    /** An admin refused the withdrawal; credit, reference = withdrawalId. */
    WITHDRAWAL_RETURNED
}
