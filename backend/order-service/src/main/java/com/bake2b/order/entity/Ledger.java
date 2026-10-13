package com.bake2b.order.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Escrow balance of an order; held/disbursed/refunded/paid-out/commission never exceed what buyer paid (NFR-09).
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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(nullable = false)
    private Long held = 0L;

    @Column(nullable = false)
    private Long disbursed = 0L;

    @Column(nullable = false)
    private Long refunded = 0L;

    @Column(nullable = false)
    private Long paidOut = 0L;

    @Column(nullable = false)
    private Long commission = 0L;

    /** Shown in reconciliation (AC-43.1); null while a dispute is open. */
    private LocalDate expectedPayoutDate;

    @Version
    private Long version;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
