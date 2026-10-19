package com.moonkage.catalog.mapper;

import com.moonkage.catalog.dto.response.PriceTierResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.entity.ProductPriceTier;
import java.util.List;
import java.util.function.UnaryOperator;

/** Entity → DTO for products. DTOs must not depend on entities (ArchitectureTest). */
public final class ProductMapper {

    private ProductMapper() {}

    /** imageUrl turns an image object key into the URL a browser loads. */
    public static ProductResponse toResponse(Product p, UnaryOperator<String> imageUrl) {
        return ProductResponse.builder()
                .id(p.getId())
                .vendorId(p.getVendorId())
                .name(p.getName())
                .description(p.getDescription())
                .cakeType(p.getCakeType())
                .brand(p.getBrand())
                .origin(p.getOrigin())
                .piecesPerBox(p.getPiecesPerBox())
                .listPrice(p.getListPrice())
                .stock(p.getStock())
                .inStock(p.getStock() != null && p.getStock() > 0)
                .expiryDate(p.getExpiryDate())
                .deliveryLabel(p.getDeliveryLabel())
                .quoteThreshold(p.getQuoteThreshold())
                .status(p.getStatus())
                .removedReason(p.getRemovedReason())
                .imageKeys(List.copyOf(p.getImageKeys()))
                .imageUrls(p.getImageKeys().stream().map(imageUrl).toList())
                .priceTiers(p.getPriceTiers().stream()
                        .map(ProductMapper::toResponse)
                        .toList())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    public static PriceTierResponse toResponse(ProductPriceTier t) {
        return new PriceTierResponse(t.getFromQty(), t.getUnitPrice());
    }
}
