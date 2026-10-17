package com.moonkage.order.entity;

import com.moonkage.order.enums.OrderKind;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

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
