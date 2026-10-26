package com.moonkage.catalog.dto.client;

/**
 * Mirror of vendor-service VendorView (GET /internal/vendors/by-owner).
 *
 * @param canOperate approved and registration fee paid (BR-20, BR-31), computed by vendor-service
 */
public record VendorInfo(
        String id,
        String ownerAccountId,
        String businessName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        boolean canOperate) {}
