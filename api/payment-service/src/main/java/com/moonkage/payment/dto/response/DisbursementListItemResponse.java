package com.moonkage.payment.dto.response;

import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import java.time.Instant;

/** A paged disbursement row with its ledger context, avoiding one HTTP request per order. */
public record DisbursementListItemResponse(
        String requestId,
        String orderId,
        String vendorId,
        long amount,
        Long approvedAmount,
        DisbursementPurpose purpose,
        DisbursementStatus status,
        String reason,
        Instant createdAt,
        Instant decidedAt,
        LedgerResponse ledger) {}
