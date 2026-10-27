package com.moonkage.order.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** @param quantity added to what the cart already holds of the product */
public record AddCartItemRequest(
        @NotBlank @Size(max = 36) String productId,
        @Positive @Max(MAX_QUANTITY) int quantity) {

    /** Far above any stock; keeps the arithmetic small. */
    public static final int MAX_QUANTITY = 100_000;
}
