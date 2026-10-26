package com.moonkage.vendor.common.vo;

/** From {@code fromQty} items on, each costs {@code unitPrice} (FR-31, FR-35). */
public record PriceTier(Quantity fromQty, Price unitPrice) {

    public static PriceTier of(Integer fromQty, Long unitPrice) {
        return new PriceTier(Quantity.of(fromQty), Price.of(unitPrice));
    }
}
