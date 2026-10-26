package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Registered business selling on the platform, owned by exactly one account (FR-26, BR-11). Its status only moves
 * through the methods below, each checked against {@link VendorStatus#canTransitionTo}.
 */
@Entity
@Table(name = "vendors")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** accounts.id in identity-service; one vendor per account for now (BR-11). No FK: another service owns it. */
    @Column(name = "owner_account_id", nullable = false, unique = true)
    private String ownerAccountId;

    /** Name of the business unit (L-02, D-09); a person's legal name lives in identity-service. */
    @Column(nullable = false)
    private String businessName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VendorEntityType entityType;

    @Column(nullable = false)
    private TaxCode taxCode;

    @Column(nullable = false)
    private String address;

    /** Head-office province (L-15); an order outside it is inter-province (glossary). */
    @Column(nullable = false, length = 2)
    private ProvinceCode provinceCode;

    /** Owner / representative as written on the business licence (BR-27, AC-26.1). */
    @Column(length = RepresentativeName.MAX_LENGTH)
    private RepresentativeName representativeName;

    /** Keyed hash made by identity-service (NFR-03, D-07); the full id number is never stored. */
    @Column(length = 64)
    private String representativeIdHash;

    private Integer representativeIdKeyVer;

    @Column(length = 12)
    private String representativeIdMasked;

    @Embedded
    private BankAccount bankAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplySource supplySource;

    @Column(nullable = false)
    private boolean sellsShop;

    @Column(nullable = false)
    private boolean acceptsOrders;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorStatus status;

    /** Reason for NEEDS_INFO / REJECTED / LOCKED (AC-27.2, AC-46.2, AC-47.2). */
    @Column(columnDefinition = "TEXT")
    private String statusReason;

    /** Flat fee per order delivered inside the vendor's areas (FR-28, BR-30). */
    private Long localDeliveryFee;

    /** Registration fee paid once after approval (BR-31); the amount is the level at payment time (AC-53.2). */
    @Column(length = 36)
    private String registrationFeePaymentId;

    private Long registrationFeeAmount;

    private Instant registrationFeePaidAt;

    @Version
    private long version;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    /** A first submission (FR-26): the submitting account becomes the owner (AC-26.3); the profile waits for review. */
    static Vendor register(String ownerAccountId, VendorProfile profile) {
        Vendor vendor = new Vendor();
        vendor.ownerAccountId = ownerAccountId;
        vendor.status = VendorStatus.PENDING;
        vendor.apply(profile);
        return vendor;
    }

    /** AC-27.2: only after NEEDS_INFO or REJECTED; the new profile waits for review again. */
    void resubmit(VendorProfile profile) {
        moveTo(VendorStatus.PENDING, null);
        apply(profile);
    }

    /** FR-45: only a pending profile is decided; the reason is what the owner reads (AC-27.2). */
    void decide(ReviewDecision decision, String reason) {
        moveTo(decision.getResultingStatus(), reason);
    }

    boolean isOwnedBy(String accountId) {
        return ownerAccountId.equals(accountId);
    }

    /** May sell and receive requests: approved and registration fee paid (BR-20, BR-31, AC-27.3, AC-27.4). */
    boolean canOperate() {
        return status == VendorStatus.APPROVED && registrationFeePaidAt != null;
    }

    private void moveTo(VendorStatus target, String reason) {
        if (!status.canTransitionTo(target)) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        status = target;
        statusReason = reason;
    }

    private void apply(VendorProfile profile) {
        businessName = profile.businessName();
        entityType = profile.entityType();
        taxCode = profile.taxCode();
        address = profile.address();
        provinceCode = profile.provinceCode();
        representativeName = profile.representativeName();
        representativeIdHash = profile.representativeIdNumber().hash();
        representativeIdKeyVer = profile.representativeIdNumber().keyVersion();
        representativeIdMasked = profile.representativeIdNumber().masked();
        supplySource = profile.supplySource();
        sellsShop = profile.sellsShop();
        acceptsOrders = profile.acceptsOrders();
        bankAccount = profile.bankAccount();
    }
}
