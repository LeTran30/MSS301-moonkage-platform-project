package com.moonkage.payment.entity;

import com.moonkage.payment.enums.WalletEntryKind;
import com.moonkage.payment.enums.WalletEntryReason;
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

/** One money movement of a wallet. Insert only: a trigger refuses updates and deletes. */
@Entity
@Immutable
@Table(name = "wallet_entries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalletEntry {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private WalletEntryKind kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WalletEntryReason reason;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 36)
    private String referenceId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static WalletEntry of(
            String accountId, WalletEntryKind kind, WalletEntryReason reason, long amount, String referenceId) {
        WalletEntry entry = new WalletEntry();
        entry.id = UUID.randomUUID().toString();
        entry.accountId = accountId;
        entry.kind = kind;
        entry.reason = reason;
        entry.amount = amount;
        entry.referenceId = referenceId;
        return entry;
    }
}
