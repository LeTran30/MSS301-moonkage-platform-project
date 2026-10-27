package com.moonkage.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Body of POST /internal/products/snapshot from order-service (D-14): the products of a cart and where they go.
 *
 * @param provinceCode the delivery province (Q-12); null when only the products are asked (adding to a cart), then
 *     no vendor is deliverable
 */
public record ProductSnapshotRequest(
        @Size(max = 2) String provinceCode,
        @NotEmpty @Size(max = MAX_PRODUCTS) List<@NotBlank String> productIds) {

    /** More products than any cart holds. */
    public static final int MAX_PRODUCTS = 100;
}
