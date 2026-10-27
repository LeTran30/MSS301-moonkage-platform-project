package com.moonkage.order.client.dto;

/** vendor-service GET /internal/vendors/by-owner/{accountId}: the vendor an account owns (BR-11). */
public record VendorView(String id, String ownerAccountId, String businessName, boolean canOperate) {}
