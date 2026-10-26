package com.moonkage.quotation.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.RequestStatus;
import com.moonkage.quotation.enums.RequestType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * @param invitedCount vendors invited (AC-16.3)
 * @param quoteCount live quotes received: latest revisions that were not withdrawn (AC-16.3)
 * @param suggestedUnitPrice for a vendor viewer only: the reference price tier for this quantity (AC-38.2)
 */
public record QuoteRequestResponse(
        String id,
        RequestType type,
        String buyerAccountId,
        String targetVendorId,
        String productId,
        int quantity,
        Long budget,
        List<CustomType> customTypes,
        String customSpec,
        LocalDate deliveryDeadline,
        DeliveryAddressResponse delivery,
        RequestStatus status,
        int invitedCount,
        int quoteCount,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long suggestedUnitPrice,
        Instant createdAt) {}
