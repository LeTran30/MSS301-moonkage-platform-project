package com.moonkage.vendor.product.dto.response;

import com.moonkage.vendor.product.ReservationStatus;
import java.time.Instant;
import java.util.List;

/**
 * The pieces held for a checkout, as order-service charges them. The same answer for every call with the same
 * checkoutId.
 *
 * @param items in productId order
 */
public record StockReservationResponse(
        String checkoutId, ReservationStatus status, Instant expiresAt, List<Item> items) {

    /**
     * @param unitPrice VAT included, fixed when held: the matching price tier, else the list price (AC-31.1)
     */
    public record Item(String productId, String vendorId, int qty, long unitPrice) {}
}
