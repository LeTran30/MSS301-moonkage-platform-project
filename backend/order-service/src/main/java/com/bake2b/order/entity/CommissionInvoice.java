package com.bake2b.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

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
