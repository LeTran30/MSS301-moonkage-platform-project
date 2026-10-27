package com.moonkage.order.client.dto;

import java.util.List;
import java.util.Optional;

/** Answer of catalog-service POST /internal/products/snapshot: products as catalog shows them, fee per vendor. */
public record ProductSnapshotResponse(List<ProductPart> products, List<VendorPart> vendors) {

    public Optional<ProductPart> product(String productId) {
        return products.stream().filter(p -> p.productId().equals(productId)).findFirst();
    }

    public Optional<VendorPart> vendor(String vendorId) {
        return vendors.stream().filter(v -> v.vendorId().equals(vendorId)).findFirst();
    }

    /**
     * @param ownerAccountId BR-22: the owner may not buy it
     * @param quoteThreshold from this quantity on, the vendor sells through a quote (BR-03); null = none
     * @param purchasable on sale, Shop on, vendor allowed to operate
     */
    public record ProductPart(
            String productId,
            String vendorId,
            String ownerAccountId,
            String name,
            long listPrice,
            int stock,
            Integer quoteThreshold,
            String deliveryLabel,
            boolean purchasable) {}

    /** @param shippingFee whole VND; null when not deliverable (BR-30) */
    public record VendorPart(
            String vendorId, String vendorName, boolean deliverable, boolean interprovince, Long shippingFee) {}
}
