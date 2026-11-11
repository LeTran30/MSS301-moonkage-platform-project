package com.moonkage.order.client.dto;

/** payment-service GET /internal/ledgers/{orderId}/state: what of the order's money already reached the vendor. */
public record LedgerState(String orderId, long held, long disbursed, long paidOut, long pendingDisbursement) {

    /** Nothing went to the vendor and nothing is asked: all of it can go back to the buyer. */
    public boolean untouched() {
        return disbursed == 0 && paidOut == 0 && pendingDisbursement == 0;
    }
}
