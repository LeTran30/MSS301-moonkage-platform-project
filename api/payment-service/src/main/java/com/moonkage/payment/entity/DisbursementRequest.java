package com.moonkage.payment.entity;

import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
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

    /** orders.id in order-service; no FK across services. */
    @Column(name = "order_id", nullable = false)
    private String orderId;

    @Column(length = 36)
    private String vendorId;

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

    /** The admin account that decided (FR-47). */
    @Column(length = 36)
    private String decidedBy;

    private Instant decidedAt;

    @CreationTimestamp
    private Instant createdAt;
}
