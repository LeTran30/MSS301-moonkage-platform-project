package com.moonkage.payment.dto.response;

/**
 * GET /internal/ledgers/{orderId}/state for order-service: whether the vendor already took or asked for part of the
 * order's money. A Shop may reject a custom order only while nothing left the platform (Q-01).
 *
 * @param pendingDisbursement asked for and not reviewed yet
 */
public record LedgerStateResponse(String orderId, long held, long disbursed, long paidOut, long pendingDisbursement) {

    /** Nothing went to the vendor and nothing is asked: all of it can go back to the buyer. */
    public boolean untouched() {
        return disbursed == 0 && paidOut == 0 && pendingDisbursement == 0;
    }
}
