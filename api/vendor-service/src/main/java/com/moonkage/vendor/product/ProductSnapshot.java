package com.moonkage.vendor.product;

import java.time.LocalDate;
import java.util.List;

/**
 * The whole state of a product that catalog-service copies (product_views): the {@code data} of the envelope sent on
 * product.upserted, whose {@code sourceVersion} is the product's version. A full snapshot: a field that is null is
 * null now (docs/services/catalog/contract-proposal.md, section 4).
 *
 * @param imageKeys object keys in the public bucket, in display order; the copy builds the URLs
 * @param crustCodes codes of the FR-54 catalogue; a rename there sends no event, the code stays
 * @param resold whether brand and origin are the producer's, not the Shop's (AC-33.2)
 */
record ProductSnapshot(
        String productId,
        String vendorId,
        String name,
        String description,
        List<String> crustCodes,
        List<String> fillingCodes,
        String brand,
        String origin,
        boolean resold,
        Integer piecesPerBox,
        long listPrice,
        int stock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Integer quoteThreshold,
        ProductStatus status,
        List<String> imageKeys,
        List<PriceTierSnapshot> priceTiers) {

    record PriceTierSnapshot(int fromQty, long unitPrice) {}

    /**
     * The {@code data} of product.removed: the product left the catalog for good (BR-24), only who it was. Its
     * {@code sourceVersion} is still the product's, so a late product.upserted cannot bring it back.
     */
    record Removed(String productId, String vendorId, ProductStatus status) {}
}
