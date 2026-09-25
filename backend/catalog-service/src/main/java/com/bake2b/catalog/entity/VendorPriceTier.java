package com.bake2b.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Represents a vendor-specific pricing tier for a product.
 */
@Entity
@Table(name = "vendor_price_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private Integer minQuantity;

    private Integer maxQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    private String currency;
}
