package com.moonkage.quotation.dto.event;

import java.time.Instant;

/** payment.failed as payment-service sends it; {@code reason} is DECLINED or EXPIRED. */
public record PaymentFailedEvent(
        String eventId,
        String paymentId,
        String purpose,
        String referenceId,
        long amount,
        String reason,
        String gatewayResponseCode,
        Instant failedAt) {}
