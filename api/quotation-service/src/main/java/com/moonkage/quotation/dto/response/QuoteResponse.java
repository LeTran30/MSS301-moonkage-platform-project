package com.moonkage.quotation.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.moonkage.quotation.enums.QuoteStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * One quote in the comparison table (FR-17).
 *
 * @param acceptable false once expired or withdrawn, so the accept button is disabled (AC-17.3)
 * @param previousRevisions older revisions this quote replaced, newest first; only with includeRevisions=true
 */
public record QuoteResponse(
        String id,
        String requestId,
        String vendorId,
        String vendorName,
        int revisionNo,
        String supersedesQuoteId,
        List<QuoteItemResponse> items,
        long itemsAmount,
        long customSurcharge,
        long shippingFee,
        long totalAmount,
        BigDecimal depositRate,
        long depositAmount,
        long remainingAmount,
        LocalDate deliveryDate,
        String deliveryMethod,
        Instant validUntil,
        String notes,
        QuoteStatus status,
        boolean acceptable,
        Instant submittedAt,
        Instant withdrawnAt,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<QuoteResponse> previousRevisions) {}
