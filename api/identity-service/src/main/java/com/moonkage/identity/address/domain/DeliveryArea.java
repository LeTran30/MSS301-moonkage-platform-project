package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;

/** What products and sellers are filtered by for an address (AC-03.2). Today the province code (Q-12). */
public record DeliveryArea(String code) {

    public DeliveryArea {
        Text.assertPresent(code, "delivery area");
    }
}
