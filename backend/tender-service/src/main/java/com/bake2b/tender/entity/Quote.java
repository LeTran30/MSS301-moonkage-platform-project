package com.bake2b.tender.entity;

import com.bake2b.tender.enums.*;
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
 * Vendor quote in the standard format (FR-38). Withdraw + resend instead of edit (BR-05).
 */
@Entity
@Table(name = "quotes")
@Getter
@Setter
@NoArgsConstructor
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_request_id", nullable = false)
    private TenderRequest tenderRequest;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Long unitPrice;

    private Long customSurcharge;

    @Column(nullable = false)
    private Long totalAmount;

    /** Percent, e.g. 30.00. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal depositRate;

    @Column(nullable = false)
    private LocalDate deliveryDate;

    @Column(nullable = false)
    private String deliveryMethod;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteStatus status = QuoteStatus.SUBMITTED;

    private LocalDateTime withdrawnAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
