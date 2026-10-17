package com.moonkage.tender.entity;

import com.moonkage.tender.enums.QuoteStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

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
