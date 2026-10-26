package com.moonkage.order.dto.response;

import java.util.List;

/**
 * The cart split by Shop with each Shop's delivery fee to the chosen province (FR-08, AC-09.1, BR-30). Prices are the
 * list prices shown in the catalog; the checkout charges the price vendor-service holds the stock at.
 *
 * @param totalAmount items and delivery fees of the Shops that deliver there
 */
public record CartResponse(String provinceCode, List<Group> groups, long totalAmount) {

    /**
     * @param shippingFee null when the Shop does not deliver to the province
     * @param subtotal items of this Shop, without the fee
     */
    public record Group(
            String vendorId,
            String vendorName,
            boolean deliverable,
            boolean interprovince,
            Long shippingFee,
            long subtotal,
            List<Line> items) {}

    /** @param available still on sale with enough stock for {@code quantity} */
    public record Line(
            String itemId, String productId, String productName, long unitPrice, int quantity, boolean available) {}
}
