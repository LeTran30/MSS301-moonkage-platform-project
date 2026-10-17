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
import java.time.LocalDateTime;
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

    @Column(nullable = false)
    private String legalName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorEntityType entityType;

    @Column(nullable = false)
    private String taxCode;

    @Column(nullable = false)
    private String address;

    /** Vendor's home area; an order outside it is inter-province (glossary). */
    @Column(nullable = false)
    private String areaCode;

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

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
