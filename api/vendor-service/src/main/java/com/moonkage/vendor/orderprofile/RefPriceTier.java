package com.moonkage.vendor.orderprofile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Reference (non-binding) price tier on an order profile (BR-05).
 */
@Entity
@Table(name = "ref_price_tiers")
@Getter
@Setter
@NoArgsConstructor
class RefPriceTier {

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
