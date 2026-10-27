package com.moonkage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Copy of an order from order-service's events, for the payout list (AC-48.1) and reconciliation. Never the ground
 * for a payout: order-service locks the order first (P-02).
 */
@Entity
@Table(name = "order_snapshots")
@Getter
@Setter
@NoArgsConstructor
public class OrderSnapshot {

    @Id
    @Column(length = 36)
    private String orderId;

    @Column(nullable = false, length = 36)
    private String vendorId;

    /** BUY_NOW or CUSTOM_ORDER. */
    @Column(nullable = false, length = 20)
    private String kind;

    @Column(nullable = false)
    private boolean interprovince;

    @Column(nullable = false)
    private Long totalAmount;

    @Column(nullable = false, length = 30)
    private String status;

    private Instant complaintDeadline;

    @Column(nullable = false)
    private boolean receivedConfirmed;

    @Column(nullable = false)
    private boolean disputeOpen;

    /** The order's version in the last event applied; an older event is skipped. */
    @Column(nullable = false)
    private long sourceVersion;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    /** Received, or past the complaint deadline, and no open dispute (AC-48.1); the payout lock decides for real. */
    public boolean looksPayable(Instant now) {
        boolean settled = receivedConfirmed || (complaintDeadline != null && now.isAfter(complaintDeadline));
        return settled && !disputeOpen;
    }
}
