package com.moonkage.quotation.dto.response;

import com.moonkage.quotation.enums.AcceptanceStatus;
import java.time.Instant;

/** Where to pay the deposit; the order exists only after the deposit succeeds (BR-04). */
public record AcceptQuoteResponse(
        String acceptanceId,
        AcceptanceStatus status,
        long depositAmount,
        String paymentId,
        String paymentUrl,
        Instant paymentExpiresAt) {}
