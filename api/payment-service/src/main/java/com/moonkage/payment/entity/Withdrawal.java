package com.moonkage.payment.entity;

import com.moonkage.payment.enums.WithdrawalStatus;
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
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** A buyer's request to send wallet money to a bank account; an admin transfers it by hand (Q-01). */
@Entity
@Table(name = "withdrawals")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Withdrawal {

    @Id
    @Column(length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Column(nullable = false)
    private Long amount;

    /** The bank's BIN in the VietQR list. */
    @Column(nullable = false, length = 10)
    private String bankBin;

    @Column(nullable = false)
    private String bankName;

    @Column(nullable = false, length = 30)
    private String accountNumber;

    /** As written on the bank account, upper case without accents. */
    @Column(nullable = false, length = 100)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectReason;

    @Column(length = 36)
    private String reviewedBy;

    private Instant reviewedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
