package com.moonkage.quotation.dto.request;

import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.RequestType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

/**
 * FR-15, FR-16. No personal or business question is asked (AC-15.3).
 *
 * @param targetVendorId required for DIRECT, ignored for OPEN
 * @param budget VND, optional
 */
public record CreateQuoteRequestRequest(
        @NotNull RequestType type,
        @Size(max = 36) String targetVendorId,
        @Size(max = 36) String productId,
        @NotNull @Positive Integer quantity,
        @Positive Long budget,
        Set<CustomType> customTypes,
        @Size(max = 2000) String customSpec,
        @NotNull LocalDate deliveryDeadline,
        @NotNull @Valid DeliveryAddressRequest delivery) {}
