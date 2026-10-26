package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * A vendor's "accepting orders" profile (FR-35), at most one per vendor. Part of the Vendor aggregate: replaced
 * only through the vendor, which then announces its new state (vendor.updated, read by quotation-service).
 */
@Entity
@Table(name = "order_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class OrderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String vendorId;

    @Column(nullable = false)
    private Quantity minQty;

    @Column(nullable = false)
    private int leadTimeDays;

    @OneToMany(mappedBy = "orderProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefPriceTier> priceTiers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "order_profile_custom_types", joinColumns = @JoinColumn(name = "order_profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "custom_type", nullable = false)
    private Set<CustomType> customTypes = new HashSet<>();

    /** Informational only; its effect on a quote price is open (Q-20). */
    @Column(columnDefinition = "TEXT")
    private String earlyBirdOffer;

    private Quantity weeklyCapacity;

    private String packagingTypes;

    private Boolean logoPrinting;

    private String distributedBrands;

    private Quantity gatherableQty;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    static OrderProfile of(String vendorId, OrderTerms terms) {
        OrderProfile profile = new OrderProfile();
        profile.vendorId = vendorId;
        profile.replace(terms);
        return profile;
    }

    void replace(OrderTerms terms) {
        minQty = terms.minQty();
        leadTimeDays = terms.leadTimeDays();
        earlyBirdOffer = terms.earlyBirdOffer();
        weeklyCapacity = terms.weeklyCapacity();
        packagingTypes = terms.packagingTypes();
        logoPrinting = terms.logoPrinting();
        distributedBrands = terms.distributedBrands();
        gatherableQty = terms.gatherableQty();
        customTypes.clear();
        customTypes.addAll(terms.customTypes());
        replacePriceTiers(terms.priceTiers());
    }

    PriceTiers toPriceTiers() {
        return PriceTiers.of(priceTiers.stream().map(RefPriceTier::toPriceTier).toList());
    }

    /**
     * Keeps the row of a tier whose start stays, so no insert meets the unique (order_profile_id, from_qty) of a row
     * still waiting to be deleted (Hibernate inserts before it deletes).
     */
    private void replacePriceTiers(PriceTiers tiers) {
        Map<Quantity, PriceTier> wanted =
                tiers.tiers().stream().collect(Collectors.toMap(PriceTier::fromQty, Function.identity()));
        priceTiers.removeIf(existing -> !wanted.containsKey(existing.getFromQty()));
        Set<Quantity> kept = new HashSet<>();
        for (RefPriceTier existing : priceTiers) {
            existing.changeUnitPrice(wanted.get(existing.getFromQty()).unitPrice());
            kept.add(existing.getFromQty());
        }
        wanted.values().stream()
                .filter(tier -> !kept.contains(tier.fromQty()))
                .forEach(tier -> priceTiers.add(RefPriceTier.of(this, tier)));
    }
}
