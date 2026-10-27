package com.moonkage.order.client.dto;

import java.util.List;

/**
 * Body of catalog-service POST /internal/products/snapshot (D-14).
 *
 * @param provinceCode the delivery province; null when only the products are asked
 */
public record ProductSnapshotRequest(String provinceCode, List<String> productIds) {}
