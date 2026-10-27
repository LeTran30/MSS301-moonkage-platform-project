package com.moonkage.payment.enums;

/** ledger_entries.kind: the four ways money moves on an order's ledger (NFR-09). */
public enum LedgerEntryKind {
    /** The buyer paid (checkout share, deposit, remainder). */
    COLLECT,
    /** Part of the deposit released to the vendor before delivery (FR-47). */
    DISBURSE,
    /** Back to the buyer after a dispute (FR-49). */
    REFUND,
    /** The rest to the vendor once the order may be paid out (FR-48). */
    PAYOUT
}
