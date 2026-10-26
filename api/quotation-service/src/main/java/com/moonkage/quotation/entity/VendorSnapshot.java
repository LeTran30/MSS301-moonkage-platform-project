package com.moonkage.quotation.entity;

import com.moonkage.quotation.enums.CustomType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Copy of a vendor kept from vendor.updated, so BR-16, BR-20, BR-22 and BR-31 are checked without calling
 * vendor-service on every request (Software Design 5.4). Read-only here: only the event consumer writes it.
 */
@Entity
@Table(name = "vendor_snapshots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VendorSnapshot {

    @Id
    @Column(name = "vendor_id", length = 36)
    private String vendorId;

    @Column(name = "owner_account_id", nullable = false, length = 36)
    private String ownerAccountId;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "tax_code", length = 20)
    private String taxCode;

    @Column(nullable = false, length = 20)
    private String status;

    /** Approved, not locked and registration fee paid (BR-20, BR-31). */
    @Column(name = "can_operate", nullable = false)
    private boolean canOperate;

    @Column(name = "sells_shop", nullable = false)
    private boolean sellsShop;

    @Column(name = "accepts_orders", nullable = false)
    private boolean acceptsOrders;

    @Column(name = "supply_source", nullable = false, length = 20)
    private String supplySource;

    /** Province codes the vendor delivers to (Q-12). */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "delivery_areas", nullable = false, columnDefinition = "text[]")
    private List<String> deliveryAreas;

    @Column(name = "min_qty")
    private Integer minQty;

    /** [{"fromQty": 100, "unitPrice": 95000}, ...]; for reference only, the quote's price binds (BR-05). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ref_price_tiers", nullable = false, columnDefinition = "jsonb")
    private String refPriceTiers;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "custom_capabilities", nullable = false, columnDefinition = "text[]")
    private List<String> customCapabilities;

    @Column(name = "early_bird_offer", columnDefinition = "TEXT")
    private String earlyBirdOffer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "production_profile", nullable = false, columnDefinition = "jsonb")
    private String productionProfile;

    @Column(name = "source_version", nullable = false)
    private long sourceVersion;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isOwnedBy(String accountId) {
        return ownerAccountId.equals(accountId);
    }

    /** BR-20, BR-31: locked, unpaid or not taking orders means no new request or quote. */
    public boolean isTakingOrders() {
        return acceptsOrders && canOperate;
    }

    public boolean meetsMinQty(int quantity) {
        return minQty == null || minQty <= quantity;
    }

    public boolean canMake(Set<CustomType> types) {
        return types.stream().allMatch(t -> customCapabilities.contains(t.name()));
    }

    public boolean deliversTo(String provinceCode) {
        return deliveryAreas.contains(provinceCode);
    }
}
