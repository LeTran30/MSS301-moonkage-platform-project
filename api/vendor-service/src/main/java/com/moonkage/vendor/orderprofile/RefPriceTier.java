package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.Quantity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A reference price tier of an order profile (AC-35.1): what buyers can expect, not a binding price (BR-05). */
@Entity
@Table(name = "ref_price_tiers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class RefPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_profile_id", nullable = false)
    private OrderProfile orderProfile;

    @Column(nullable = false)
    private Quantity fromQty;

    @Column(nullable = false)
    private Price unitPrice;

    static RefPriceTier of(OrderProfile orderProfile, PriceTier tier) {
        RefPriceTier refTier = new RefPriceTier();
        refTier.orderProfile = orderProfile;
        refTier.fromQty = tier.fromQty();
        refTier.unitPrice = tier.unitPrice();
        return refTier;
    }

    PriceTier toPriceTier() {
        return new PriceTier(fromQty, unitPrice);
    }

    void changeUnitPrice(Price unitPrice) {
        this.unitPrice = unitPrice;
    }
}
