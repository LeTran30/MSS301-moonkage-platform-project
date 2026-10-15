package com.bake2b.order.entity;

import com.bake2b.order.enums.DisbursementPurpose;
import com.bake2b.order.enums.DisbursementStatus;
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
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

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
