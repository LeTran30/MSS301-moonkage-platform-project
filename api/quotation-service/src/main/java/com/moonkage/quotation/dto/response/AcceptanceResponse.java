package com.moonkage.quotation.dto.response;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.moonkage.quotation.enums.AcceptanceStatus;
import java.time.Instant;

/**
 * The binding copy and its deposit (FR-19).
 *
 * @param snapshot the frozen agreement, as JSON
 * @param contentHash SHA-256 of the canonical snapshot: proves the content did not change after acceptance
 */
public record AcceptanceResponse(
        String id,
        String quoteId,
        String requestId,
        AcceptanceStatus status,
        long depositAmount,
        String contentHash,
        @JsonRawValue String snapshot,
        Instant acceptedAt,
        Instant paymentExpiresAt,
        Instant paidAt) {}
