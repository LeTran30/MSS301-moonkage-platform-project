package com.moonkage.catalog.entity.projection;

import com.moonkage.reference.Province;
import java.util.List;
import java.util.Set;

/** Normalized state only. This does not assume that vendor.locked carries a full wire snapshot. */
public record VendorProjectionRow(
        String vendorId,
        String ownerAccountId,
        String businessName,
        String status,
        boolean canOperate,
        boolean sellsShop,
        List<String> deliveryAreas,
        Long localDeliveryFee,
        long sourceVersion) {
    private static final Set<String> STATUSES = Set.of("PENDING", "NEEDS_INFO", "APPROVED", "REJECTED", "LOCKED");

    public VendorProjectionRow {
        ProjectionRowValidation.requireId(vendorId);
        ProjectionRowValidation.requireId(ownerAccountId);
        deliveryAreas = List.copyOf(deliveryAreas);
        if (businessName == null
                || businessName.isBlank()
                || status == null
                || !STATUSES.contains(status)
                || (canOperate && !"APPROVED".equals(status))
                || sourceVersion < 0
                || (localDeliveryFee != null && localDeliveryFee < 0)
                || deliveryAreas.stream().anyMatch(code -> !Province.isKnown(code))) {
            throw new IllegalArgumentException("Invalid normalized vendor projection row");
        }
    }
}
