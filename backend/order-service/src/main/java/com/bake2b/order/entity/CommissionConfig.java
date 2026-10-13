package com.bake2b.order.entity;

import com.bake2b.order.enums.*;
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
 * Commission rate per order kind, effective from a point in time (FR-50, BR-10). Append-only.
 */
@Entity
@Table(name = "commission_configs")
@Getter
@Setter
@NoArgsConstructor
public class CommissionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderKind kind;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rate;

    @Column(nullable = false)
    private LocalDateTime effectiveFrom;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
