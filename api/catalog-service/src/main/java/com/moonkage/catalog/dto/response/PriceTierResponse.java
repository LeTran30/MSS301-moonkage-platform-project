package com.moonkage.catalog.dto.response;

import com.moonkage.catalog.entity.ProductPriceTier;

public record PriceTierResponse(Integer fromQty, Long unitPrice) {

    public static PriceTierResponse from(ProductPriceTier t) {
        return new PriceTierResponse(t.getFromQty(), t.getUnitPrice());
    }
}
