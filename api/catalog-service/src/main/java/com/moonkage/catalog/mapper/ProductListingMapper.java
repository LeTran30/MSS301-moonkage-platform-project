package com.moonkage.catalog.mapper;

import com.moonkage.catalog.dto.response.ProductListingResponse;
import com.moonkage.catalog.entity.readmodel.ProductListing;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public final class ProductListingMapper {
    private ProductListingMapper() {}

    public static ProductListingResponse toResponse(
            ProductListing product, String accountId, Function<String, String> imageUrl) {
        List<String> keys = List.of(product.getImageKeys());
        return new ProductListingResponse(
                product.getProductId(),
                product.getVendorId(),
                product.getVendorName(),
                product.getName(),
                product.getDescription(),
                List.of(product.getCrustCodes()),
                List.of(product.getFillingCodes()),
                product.getBrand(),
                product.getOrigin(),
                product.getPiecesPerBox(),
                product.getListPrice(),
                product.getStock(),
                product.getStock() > 0,
                product.getExpiryDate(),
                product.getDeliveryLabel(),
                product.getQuoteThreshold(),
                product.getStatus(),
                keys,
                keys.stream().map(imageUrl).toList(),
                product.getPriceTiers().deepCopy(),
                product.getRatingAvg(),
                product.getRatingCount(),
                Objects.equals(accountId, product.getOwnerAccountId()),
                product.getUpdatedAt());
    }
}
