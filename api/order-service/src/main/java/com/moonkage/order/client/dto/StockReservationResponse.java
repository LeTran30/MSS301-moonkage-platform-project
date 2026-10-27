package com.moonkage.order.client.dto;

import java.time.Instant;
import java.util.List;

/** The pieces vendor-service holds for a checkout, at the price it charges them (BR-28). */
public record StockReservationResponse(String checkoutId, String status, Instant expiresAt, List<Item> items) {

    /** @param unitPrice VAT included, fixed when held: the matching price tier, else the list price */
    public record Item(String productId, String vendorId, int qty, long unitPrice) {}
}
