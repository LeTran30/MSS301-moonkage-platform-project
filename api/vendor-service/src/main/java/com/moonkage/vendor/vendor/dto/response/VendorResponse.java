package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;

/**
 * Vendor summary for its owner and the admins. Other services read {@link com.moonkage.vendor.vendor.VendorView}.
 *
 * @param entityType HOUSEHOLD_BUSINESS or SOLE_PROPRIETORSHIP, so the admin list shows the kind of unit (BR-33)
 * @param registrationFeePaid whether the registration fee came in, so the admin attaches its invoice only then (Q-36)
 * @param createdAt when the profile was first submitted, so the admin list shows how long it has waited
 */
public record VendorResponse(
        String id,
        String ownerAccountId,
        String businessName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        String entityType,
        boolean registrationFeePaid,
        Instant createdAt) {}
