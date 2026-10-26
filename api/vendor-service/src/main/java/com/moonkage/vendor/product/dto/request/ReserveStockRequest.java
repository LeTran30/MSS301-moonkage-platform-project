package com.moonkage.vendor.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * POST /internal/stock/reservations from order-service: hold the pieces of a checkout until it is paid (BR-28).
 *
 * @param expiresAt checkouts.expires_at of order-service (P-01); the hold is released after it
 * @param items each product once, Shops mixed
 */
public record ReserveStockRequest(
        @NotBlank(message = "{validation.required}") @Size(max = 36, message = "{validation.too_long}")
        String checkoutId,

        @NotNull(message = "{validation.required}") Instant expiresAt,

        @NotEmpty(message = "{validation.required}") @Size(max = MAX_ITEMS, message = "{validation.too_many}")
        List<@Valid Item> items) {

    /** More lines than any cart holds. */
    public static final int MAX_ITEMS = 100;

    public record Item(
            @NotBlank(message = "{validation.required}") String productId,

            @NotNull(message = "{validation.required}") @Positive(message = "{validation.positive}")
            Integer qty) {}
}
