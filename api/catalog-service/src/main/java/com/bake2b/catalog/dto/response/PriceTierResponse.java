package com.bake2b.catalog.dto.response;

import com.bake2b.catalog.entity.ProductPriceTier;

public record PriceTierResponse(Integer fromQty, Long unitPrice) {

    public static PriceTierResponse from(ProductPriceTier t) {
        return new PriceTierResponse(t.getFromQty(), t.getUnitPrice());
    }
}
