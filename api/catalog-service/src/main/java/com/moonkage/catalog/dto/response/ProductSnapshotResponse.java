package com.moonkage.catalog.dto.response;

import com.moonkage.catalog.enums.DeliveryLabel;
import java.util.List;

/**
 * Answer of POST /internal/products/snapshot: what order-service needs to show a cart and open a checkout. Catalog is
 * the only place the delivery fee of a buy-now order is worked out, so the product page and the checkout agree
 * (BR-30, D-14). A product id catalog does not know is left out.
 */
public record ProductSnapshotResponse(List<ProductPart> products, List<VendorPart> vendors) {

    /**
     * @param ownerAccountId the vendor's owner; BR-22 forbids them buying it
     * @param listPrice VAT included; the checkout charges the price vendor-service holds the stock at
     * @param purchasable on sale, Shop on, vendor allowed to operate (BR-20, BR-21, BR-31)
     */
    public record ProductPart(
            String productId,
            String vendorId,
            String ownerAccountId,
            String name,
            long listPrice,
            int stock,
            Integer quoteThreshold,
            DeliveryLabel deliveryLabel,
            boolean purchasable) {}

    /**
     * One delivery fee per vendor for the requested products (BR-29, BR-30).
     *
     * @param deliverable false when the province is outside the vendor's areas and a product is not nationwide, or
     *     the fee that would apply is not set
     * @param interprovince outside the vendor's areas: the interprovince fee of the province applies
     * @param shippingFee whole VND; null when not deliverable
     */
    public record VendorPart(
            String vendorId, String vendorName, boolean deliverable, boolean interprovince, Long shippingFee) {}
}
