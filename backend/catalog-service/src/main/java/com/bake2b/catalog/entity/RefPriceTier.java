package com.bake2b.catalog.entity;

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
 * Reference (non-binding) price tier on an order profile (BR-05).
 */
@Entity
@Table(name = "ref_price_tiers")
@Getter
@Setter
@NoArgsConstructor
public class RefPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_profile_id", nullable = false)
    private OrderProfile orderProfile;

    @Column(nullable = false)
    private Integer fromQty;

    @Column(nullable = false)
    private Long unitPrice;
}
