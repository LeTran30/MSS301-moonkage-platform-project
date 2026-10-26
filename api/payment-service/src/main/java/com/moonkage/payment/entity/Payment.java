package com.moonkage.payment.entity;

import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
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
import org.hibernate.annotations.UpdateTimestamp;

/**
 * One gateway transaction, for what {@link #purpose} and {@link #referenceId} name: one checkout may pay several
 * orders (BR-29, split in payment_allocations), a registration fee pays none (BR-31). At most one SUCCEEDED per
 * (purpose, referenceId); a later success is DUPLICATE and refunded (P-03). Refunds live in refunds.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentPurpose purpose;

    /** checkoutId, acceptanceId, orderId or vendorId, by purpose; no FK across services. */
    @Column(nullable = false, length = 36)
    private String referenceId;

    @Column(length = 36)
    private String payerAccountId;

    @Column(nullable = false)
    private Long amount;

    private String method;

    /** Our reference sent to the gateway; unique, so a repeated IPN is safe (BR-25). */
    @Column(unique = true)
    private String gatewayTxnRef;

    /** The gateway's own transaction number. */
    @Column(length = 64)
    private String gatewayTxnNo;

    @Column(length = 10)
    private String gatewayResponseCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    /** A PENDING payment not paid by then is FAILED. */
    private Instant expiresAt;

    private Instant paidAt;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
