package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import java.time.Instant;

public record DisbursementResponse(
        String requestId,
        String orderId,
        long amount,
        Long approvedAmount,
        DisbursementPurpose purpose,
        DisbursementStatus status,
        String reason,
        Instant createdAt,
        Instant decidedAt) {}
