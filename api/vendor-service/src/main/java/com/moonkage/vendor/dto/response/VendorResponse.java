package com.moonkage.vendor.dto.response;

/** Vendor summary for its owner and for other services (via OpenFeign). */
public record VendorResponse(
        String id,
        String ownerAccountId,
        String businessName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders) {}
