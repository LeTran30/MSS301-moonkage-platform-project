package com.moonkage.payment.service;

import com.moonkage.payment.enums.RefundReason;

/** Money back to a payer (AC-49.3, P-01, P-03). */
public interface RefundService {

    /**
     * Records an automatic refund of a whole payment, once per payment and reason. Runs in the caller's transaction.
     *
     * @param reason LATE_PAYMENT, DUPLICATE_PAYMENT or QUOTE_EXPIRED
     */
    void requestAutomatic(String paymentId, RefundReason reason, long amount);
}
