package com.moonkage.vendor.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * POST /internal/stock/reservations/returns from order-service: a Shop rejected a paid buy-now order (Q-01), so
 * its pieces go back on sale. The items must be lines of the checkout's committed reservation.
 *
 * @param checkoutId the checkout the order was paid in
 * @param items the order's products and quantities
 */
public record ReturnStockRequest(
        @NotBlank(message = "{validation.required}") @Size(max = 36, message = "{validation.too_long}")
        String orderId,

        @NotBlank(message = "{validation.required}") @Size(max = 36, message = "{validation.too_long}")
        String checkoutId,

        @NotEmpty(message = "{validation.required}")
        @Size(max = ReserveStockRequest.MAX_ITEMS, message = "{validation.too_many}")
        List<ReserveStockRequest.@Valid Item> items) {}
