package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import java.time.Instant;

/** @param error why the gateway refused, when MANUAL_REQUIRED */
public record RefundResponse(
        String refundId,
        String orderId,
        String disputeId,
        String paymentId,
        RefundReason reason,
        long amount,
        RefundStatus status,
        String error,
        Instant createdAt) {}
