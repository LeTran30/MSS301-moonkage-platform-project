package com.moonkage.vendor.entity;

import com.moonkage.vendor.enums.CustomType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

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
