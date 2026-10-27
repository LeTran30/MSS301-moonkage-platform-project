package com.moonkage.order.client.dto;

import java.time.Instant;
import java.util.List;

/**
 * Body of vendor-service POST /internal/stock/reservations (BR-28, P-01).
 *
 * @param expiresAt checkouts.expires_at; vendor releases the hold after it
 */
public record ReserveStockRequest(String checkoutId, Instant expiresAt, List<Item> items) {

    public record Item(String productId, Integer qty) {}
}
