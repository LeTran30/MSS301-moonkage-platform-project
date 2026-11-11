package com.moonkage.payment.entity;

import com.moonkage.payment.enums.LedgerEntryKind;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/**
 * One money movement of an order (NFR-07, NFR-09). Insert only: a database trigger refuses updates and deletes, and
 * at commit the ledger must equal the sum of its entries (P-04).
 */
@Entity
@Immutable
@Table(name = "ledger_entries")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LedgerEntry {

    @Id
    @Column(length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LedgerEntryKind kind;

    @Column(nullable = false)
    private Long amount;

    /** The payment, disbursement request, refund or payout behind the movement. */
    @Column(length = 36)
    private String referenceId;

    /** The admin who approved it; null for money the buyer paid. */
    @Column(length = 36)
    private String actorAccountId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
