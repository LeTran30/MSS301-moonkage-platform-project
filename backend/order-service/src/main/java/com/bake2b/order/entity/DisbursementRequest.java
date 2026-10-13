package com.bake2b.order.entity;

import com.bake2b.order.enums.*;
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
 * Vendor request to release part of the held deposit (FR-41, FR-48, BR-09).
 */
@Entity
@Table(name = "disbursement_requests")
@Getter
@Setter
@NoArgsConstructor
public class DisbursementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Long amount;

    /** Admin may approve partially (AC-48.3). */
    private Long approvedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisbursementPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisbursementStatus status = DisbursementStatus.PENDING;

    /** Mandatory when rejected. */
    @Column(columnDefinition = "TEXT")
    private String reason;

    private LocalDateTime decidedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
