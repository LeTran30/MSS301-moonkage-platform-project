package com.moonkage.quotation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** A product line of a quote (AC-38.1). */
public record QuoteItemRequest(
        @NotBlank @Size(max = 255) String description,
        @Size(max = 36) String productRef,
        @NotNull @Positive Integer quantity,
        @NotNull @PositiveOrZero Long unitPrice) {}
