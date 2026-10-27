package com.moonkage.order.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;

/** @param quantity the new quantity of the line */
public record UpdateCartItemRequest(
        @Positive @Max(AddCartItemRequest.MAX_QUANTITY) int quantity) {}
