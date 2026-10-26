package com.moonkage.catalog.entity.projection;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/** Internal complete DB row, NOT a producer event DTO. A wire adapter requires an approved contract. */
public record ProductProjectionRow(
        String productId,
        String vendorId,
        String name,
        String description,
        List<String> crustCodes,
        List<String> fillingCodes,
        String brand,
        String origin,
        Integer piecesPerBox,
        long listPrice,
        int stock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Integer quoteThreshold,
        ProductStatus status,
        List<String> imageKeys,
        JsonNode priceTiers,
        long sourceVersion) {
    public ProductProjectionRow {
        ProjectionRowValidation.requireId(productId);
        ProjectionRowValidation.requireId(vendorId);
        Objects.requireNonNull(name);
        Objects.requireNonNull(description);
        Objects.requireNonNull(expiryDate);
        Objects.requireNonNull(deliveryLabel);
        Objects.requireNonNull(status);
        imageKeys = List.copyOf(imageKeys);
        crustCodes = List.copyOf(crustCodes);
        fillingCodes = List.copyOf(fillingCodes);
        priceTiers = Objects.requireNonNull(priceTiers).deepCopy();
        if (name.isBlank() || listPrice <= 0 || stock < 0 || sourceVersion < 0 || !priceTiers.isArray()) {
            throw new IllegalArgumentException("Invalid normalized product projection row");
        }
    }
}
