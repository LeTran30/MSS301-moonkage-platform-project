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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LedgerEntry {

    @Id
    @Column(length = 36)
    private String id;

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

    public static LedgerEntry of(
            String orderId, LedgerEntryKind kind, long amount, String referenceId, String actorAccountId) {
        LedgerEntry entry = new LedgerEntry();
        entry.id = UUID.randomUUID().toString();
        entry.orderId = orderId;
        entry.kind = kind;
        entry.amount = amount;
        entry.referenceId = referenceId;
        entry.actorAccountId = actorAccountId;
        return entry;
    }
}
