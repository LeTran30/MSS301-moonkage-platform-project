package com.moonkage.catalog.dto.response;

import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
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
}
