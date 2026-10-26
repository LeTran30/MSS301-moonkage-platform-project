package com.moonkage.vendor.product.dto.response;

import com.moonkage.vendor.product.DeliveryLabel;
import com.moonkage.vendor.product.ProductStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A product as its Shop and the admins see it. Send {@code version} back to replace it.
 *
 * @param removedReason set only when REMOVED
 */
public record ProductResponse(
        String id,
        String vendorId,
        String name,
        String description,
        String brand,
        String origin,
        boolean resold,
        Integer piecesPerBox,
        long listPrice,
        int stock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Integer quoteThreshold,
        List<PriceTier> priceTiers,
        List<Image> images,
        List<String> crustCodes,
        List<String> fillingCodes,
        ProductStatus status,
        String removedReason,
        long version,
        Instant createdAt,
        Instant updatedAt) {

    public record PriceTier(int fromQty, long unitPrice) {}

    /** {@code key} is what a replace sends back to keep the image; {@code url} shows it. */
    public record Image(String key, String url) {}
}
