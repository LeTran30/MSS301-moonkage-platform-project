package com.moonkage.vendor.product;

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

/** A quantity price of a product (AC-31.1): from fromQty on, each piece costs unitPrice. */
@Entity
@Table(name = "product_price_tiers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ProductPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Quantity fromQty;

    @Column(nullable = false)
    private Price unitPrice;

    static ProductPriceTier of(Product product, PriceTier tier) {
        ProductPriceTier productTier = new ProductPriceTier();
        productTier.product = product;
        productTier.fromQty = tier.fromQty();
        productTier.unitPrice = tier.unitPrice();
        return productTier;
    }

    PriceTier toPriceTier() {
        return new PriceTier(fromQty, unitPrice);
    }

    void changeUnitPrice(Price newUnitPrice) {
        unitPrice = newUnitPrice;
    }
}
