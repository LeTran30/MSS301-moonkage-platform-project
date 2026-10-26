package com.moonkage.quotation.dto.request;

import com.moonkage.quotation.enums.CustomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** A custom surcharge line (AC-38.2), one of the request's custom types (BR-14). */
public record CustomItemRequest(
        @NotNull CustomType customType,
        @NotBlank @Size(max = 255) String description,
        @NotNull @Positive Integer quantity,
        @NotNull @PositiveOrZero Long unitPrice) {}
