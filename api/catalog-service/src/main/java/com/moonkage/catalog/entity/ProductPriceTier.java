package com.moonkage.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Quantity price tier for buy-now (FR-32). Tiers must not overlap.
 */
@Entity
@Table(name = "product_price_tiers", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "fromQty"}))
@Getter
@Setter
@NoArgsConstructor
public class ProductPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer fromQty;

    @Column(nullable = false)
    private Long unitPrice;
}
