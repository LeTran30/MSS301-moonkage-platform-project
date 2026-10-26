package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.CustomType;
import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * A vendor's order profile (FR-35); price tiers ordered by fromQty.
 *
 * @param crustCodes codes of the FR-54 catalogue in the admin's order; labels come from GET /api/cake-attributes
 */
public record OrderProfileResponse(
        int minQty,
        int leadTimeDays,
        List<PriceTier> priceTiers,
        Set<CustomType> customTypes,
        String earlyBirdOffer,
        Integer weeklyCapacity,
        List<String> crustCodes,
        List<String> fillingCodes,
        String packagingTypes,
        Boolean logoPrinting,
        String distributedBrands,
        Integer gatherableQty,
        Instant updatedAt) {

    public record PriceTier(int fromQty, long unitPrice) {}
}
