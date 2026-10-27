package com.moonkage.payment.dto.event;

import java.time.Instant;

/**
 * payment.failed: the payer did not pay. The owner of the reference releases what it held (stock, quote lock).
 *
 * @param reason {@link #DECLINED} (VNPay answered with an error code) or {@link #EXPIRED} (no answer before
 *     expiresAt)
 * @param gatewayResponseCode vnp_ResponseCode; null when expired
 */
public record PaymentFailedEvent(
        String eventId,
        String paymentId,
        String purpose,
        String referenceId,
        long amount,
        String reason,
        String gatewayResponseCode,
        Instant failedAt) {

    public static final String DECLINED = "DECLINED";
    public static final String EXPIRED = "EXPIRED";
}
