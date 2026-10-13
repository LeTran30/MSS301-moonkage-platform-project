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
 * Platform's commission invoice to a vendor per reconciliation period (FR-45, period length Q-25).
 */
@Entity
@Table(name = "commission_invoices")
@Getter
@Setter
@NoArgsConstructor
public class CommissionInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(nullable = false)
    private Long totalCommission;

    private String fileUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
