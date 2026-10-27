package com.moonkage.payment.entity;

import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Money going back to a payer through the gateway, with a manual fallback when the gateway refuses (AC-49.3, A-11).
 * Only a dispute refund belongs to an order; the automatic ones (late, duplicate, expired quote) happen once per
 * payment, a partial unique index guarantees it.
 */
@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Refund {

    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 36)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundReason reason;

    @Column(length = 36)
    private String disputeId;

    @Column(name = "original_payment_id")
    private String originalPaymentId;

    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundStatus status;

    @Column(length = 64)
    private String gatewayRefundRef;

    @Column(columnDefinition = "TEXT")
    private String error;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    /** FR-49: through the payment that brought the order's money. */
    public static Refund dispute(String orderId, String disputeId, String originalPaymentId, long amount) {
        Refund refund = automatic(originalPaymentId, RefundReason.DISPUTE, amount);
        refund.orderId = orderId;
        refund.disputeId = disputeId;
        return refund;
    }

    /** A refund not tied to an order or dispute (LATE_PAYMENT, DUPLICATE_PAYMENT, QUOTE_EXPIRED). */
    public static Refund automatic(String originalPaymentId, RefundReason reason, long amount) {
        Refund refund = new Refund();
        refund.id = UUID.randomUUID().toString();
        refund.originalPaymentId = originalPaymentId;
        refund.reason = reason;
        refund.amount = amount;
        refund.status = RefundStatus.PENDING;
        return refund;
    }
}
