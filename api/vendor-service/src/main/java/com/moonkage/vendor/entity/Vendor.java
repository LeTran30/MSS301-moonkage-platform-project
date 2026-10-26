package com.moonkage.vendor.entity;

import com.moonkage.vendor.enums.SupplySource;
import com.moonkage.vendor.enums.VendorEntityType;
import com.moonkage.vendor.enums.VendorStatus;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Registered business selling on the platform, owned by exactly one account (FR-26, BR-11).
 */
@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
public class Vendor {

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
    private String taxCode;

    @Column(nullable = false)
    private String address;

    /** Head-office province (L-15); an order outside it is inter-province (glossary). */
    @Column(nullable = false, length = 2)
    private String provinceCode;

    /** Owner / representative as written on the business licence (BR-27, AC-26.1). */
    @Column(length = 100)
    private String representativeName;

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
    private VendorStatus status = VendorStatus.PENDING;

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
}
