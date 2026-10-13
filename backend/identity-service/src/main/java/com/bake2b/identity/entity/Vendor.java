package com.bake2b.identity.entity;

import com.bake2b.identity.enums.*;
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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false, unique = true)
    private User owner;

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
