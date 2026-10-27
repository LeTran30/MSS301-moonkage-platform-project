package com.moonkage.payment.dto.response;

import java.time.LocalDate;

/**
 * The money of one order (FR-43, AC-43.1): what the buyer paid, what the platform still holds, what went out.
 * {@code toReceive} is what the vendor will get from what is held; no commission (BR-10).
 *
 * @param kind BUY_NOW or CUSTOM_ORDER; null until order-service's events arrived
 * @param payable looks eligible for payout and not paid out yet (AC-48.1); the payout lock decides for real
 */
public record LedgerResponse(
        String orderId,
        String vendorId,
        String kind,
        String orderStatus,
        long totalCollected,
        long held,
        long disbursed,
        long refunded,
        long paidOut,
        long toReceive,
        LocalDate expectedPayoutDate,
        boolean disputeOpen,
        boolean payable) {}
