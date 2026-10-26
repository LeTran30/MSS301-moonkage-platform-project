package com.moonkage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/** FR-48: what was left for the vendor, once per order, approved by an admin (A-12: bookkeeping only). */
@Entity
@Table(name = "payouts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payout {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 36)
    private String orderId;

    @Column(nullable = false, length = 36)
    private String vendorId;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 36)
    private String approvedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static Payout of(String orderId, String vendorId, long amount, String approvedBy) {
        Payout payout = new Payout();
        payout.id = UUID.randomUUID().toString();
        payout.orderId = orderId;
        payout.vendorId = vendorId;
        payout.amount = amount;
        payout.approvedBy = approvedBy;
        return payout;
    }
}
