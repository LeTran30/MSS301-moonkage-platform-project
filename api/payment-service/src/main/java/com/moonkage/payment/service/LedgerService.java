package com.moonkage.payment.service;

import java.time.LocalDate;

/**
 * The money of each order (NFR-09). Every write runs in the caller's transaction, locks the ledger row and adds its
 * ledger_entries row, so the database can check the ledger against its entries at commit (P-04).
 */
public interface LedgerService {

    /**
     * Records money the buyer paid for an order, opening its ledger on the first payment.
     *
     * @param paymentId the payment the money came with
     */
    void collect(String orderId, long amount, String paymentId);

    /** Whether the platform still holds at least {@code amount} of the order. */
    boolean holds(String orderId, long amount);

    /** Money back to the buyer (FR-49, P-01); LEDGER_002 when more than held. */
    void refund(String orderId, long amount, String refundId, String actorAccountId);

    /** Part of the deposit released to the vendor before delivery (FR-47); LEDGER_002 when more than held. */
    void disburse(String orderId, long amount, String requestId, String actorAccountId);

    /** What is left, to the vendor (FR-48); LEDGER_002 when more than held. */
    void payout(String orderId, long amount, String payoutId, String actorAccountId);

    /** From order-service's events: the vendor the ledger belongs to, and when it should be paid (AC-43.1). */
    void describe(String orderId, String vendorId, LocalDate expectedPayoutDate);
}
