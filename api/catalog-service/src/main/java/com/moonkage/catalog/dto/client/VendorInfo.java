package com.moonkage.catalog.dto.client;

/** Mirror of vendor-service VendorResponse. */
public record VendorInfo(
        String id,
        String ownerAccountId,
        String businessName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders) {}
