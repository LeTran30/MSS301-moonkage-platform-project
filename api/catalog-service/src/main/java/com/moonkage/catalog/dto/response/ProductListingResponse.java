package com.moonkage.catalog.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** C2 basic read response; facets, expanded management access and shipping snapshot belong to C3/C4. */
public record ProductListingResponse(
        String id,
        String vendorId,
        String vendorName,
        String name,
        String description,
        String cakeType,
        String brand,
        String origin,
        Integer piecesPerBox,
        long listPrice,
        int stock,
        boolean inStock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Integer quoteThreshold,
        ProductStatus status,
        List<String> imageKeys,
        List<String> imageUrls,
        JsonNode priceTiers,
        BigDecimal ratingAvg,
        int ratingCount,
        boolean isOwn,
        Instant updatedAt) {}
