package com.moonkage.vendor.vendor.dto.response;

/** Vendor summary for its owner and the admins. Other services read {@link com.moonkage.vendor.vendor.VendorView}. */
public record VendorResponse(
        String id,
        String ownerAccountId,
        String businessName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders) {}
