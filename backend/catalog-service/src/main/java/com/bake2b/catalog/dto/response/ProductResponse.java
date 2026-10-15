package com.bake2b.catalog.dto.response;

import com.bake2b.catalog.entity.Product;
import com.bake2b.catalog.enums.DeliveryLabel;
import com.bake2b.catalog.enums.ProductStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductResponse {

    private String id;
    private String vendorId;
    private String name;
    private String description;
    private String cakeType;
    private String brand;
    private String origin;
    private Integer piecesPerBox;
    private Long listPrice;
    private Integer stock;
    /** AC-31.1: stock 0 means it cannot be bought right now. */
    private boolean inStock;

    private LocalDate expiryDate;
    private DeliveryLabel deliveryLabel;
    private Integer quoteThreshold;
    private ProductStatus status;
    private String removedReason;
    private List<String> imageUrls;
    private List<PriceTierResponse> priceTiers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductResponse from(Product p) {
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
                .imageUrls(List.copyOf(p.getImageUrls()))
                .priceTiers(
                        p.getPriceTiers().stream().map(PriceTierResponse::from).toList())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
