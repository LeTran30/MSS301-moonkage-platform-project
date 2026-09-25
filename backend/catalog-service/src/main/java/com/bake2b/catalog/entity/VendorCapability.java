package com.bake2b.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a vendor's capability to produce specific products.
 */
@Entity
@Table(name = "vendor_capabilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorCapability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String productId;

    private Integer dailyCapacity;

    private Integer leadTimeDays;

    private boolean active;
}
