package com.moonkage.catalog.entity.readmodel;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** V2 joined read model. Vendor fields are joined, never written by product projection. */
@Entity
@Immutable
@Table(name = "product_listings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductListing {
    @Id
    @Column(name = "product_id", length = 36)
    private String productId;

    @Column(name = "vendor_id", length = 36)
    private String vendorId;

    private String name;
    private String description;
    private String cakeType;
    private String brand;
    private String origin;
    private Integer piecesPerBox;
    private long listPrice;
    private int stock;
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    private DeliveryLabel deliveryLabel;

    private Integer quoteThreshold;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] imageKeys;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode priceTiers;

    @Column(precision = 3, scale = 2)
    private BigDecimal ratingAvg;

    private int ratingCount;
    private long sourceVersion;
    private Instant updatedAt;
    private String vendorName;
    private String ownerAccountId;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] deliveryAreas;

    private Long localDeliveryFee;
    private boolean canOperate;
    private boolean sellsShop;
}
