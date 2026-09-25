package com.bake2b.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Represents a quantity-based pricing tier for a product.
 */
@Entity
@Table(name = "product_price_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String productId;

    @Column(nullable = false)
    private Integer minQuantity;

    private Integer maxQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    private String currency;
}
