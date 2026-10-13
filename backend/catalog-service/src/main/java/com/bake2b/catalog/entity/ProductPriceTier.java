package com.bake2b.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Quantity price tier for buy-now (FR-32). Tiers must not overlap.
 */
@Entity
@Table(name = "product_price_tiers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "fromQty"}))
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
