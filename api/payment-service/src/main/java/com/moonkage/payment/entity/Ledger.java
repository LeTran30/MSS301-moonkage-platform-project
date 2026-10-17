package com.moonkage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Escrow balance of an order; disbursed + refunded + paid-out never exceed what the buyer paid (NFR-09).
 * No commission (BR-10).
 */
@Entity
@Table(name = "ledgers")
@Getter
@Setter
@NoArgsConstructor
public class Ledger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** orders.id in order-service; no FK across services. */
    @Column(name = "order_id", nullable = false, unique = true)
    private String orderId;

    @Column(nullable = false)
    private Long held = 0L;

    @Column(nullable = false)
    private Long disbursed = 0L;

    @Column(nullable = false)
    private Long refunded = 0L;

    @Column(nullable = false)
    private Long paidOut = 0L;

    /** Shown in reconciliation (AC-43.1); null while a dispute is open. */
    private LocalDate expectedPayoutDate;

    @Version
    private Long version;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
