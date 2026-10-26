package com.moonkage.payment.service;

/** The money of each order (NFR-09); every write adds its ledger_entries row in the same transaction (P-04). */
public interface LedgerService {

    /**
     * Records money the buyer paid for an order, opening its ledger on the first payment. Runs in the caller's
     * transaction, which also marks the payment SUCCEEDED.
     *
     * @param paymentId the payment the money came with
     */
    void collect(String orderId, long amount, String paymentId);
}
