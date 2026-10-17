package com.moonkage.catalog.dto.client;

/** Mirror of identity-service VendorInternalResponse. */
public record VendorInfo(
        String id,
        String ownerUserId,
        String legalName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders) {}
