package com.bake2b.catalog.entity;

import com.bake2b.catalog.enums.*;
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
 * Vendor's 'accepting orders' profile (FR-35). At most one per vendor.
 */
@Entity
@Table(name = "order_profiles")
@Getter
@Setter
@NoArgsConstructor
public class OrderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String vendorId;

    @Column(nullable = false)
    private Integer minQty;

    @Column(nullable = false)
    private Integer leadTimeDays;

    @ElementCollection
    @CollectionTable(name = "order_profile_custom_types", joinColumns = @JoinColumn(name = "order_profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "custom_type", nullable = false)
    private Set<CustomType> customCapabilities = new HashSet<>();

    /** Informational only; effect on quote price is open (Q-20). */
    @Column(columnDefinition = "TEXT")
    private String earlyBirdOffer;

    /** Required if self-produced (AC-35.2). */
    private Integer weeklyCapacity;

    private String cakeTypes;

    private String packagingTypes;

    private Boolean logoPrinting;

    /** Required if reselling (AC-35.3). */
    private String distributedBrands;

    private Integer gatherableQty;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
