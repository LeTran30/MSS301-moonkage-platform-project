package com.bake2b.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents an early-bird discount offered by a vendor.
 */
@Entity
@Table(name = "vendor_early_discounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorEarlyDiscount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    private String productId;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent;

    private LocalDate validFrom;

    private LocalDate validTo;

    private Integer minQuantity;

    private boolean active;
}
