package com.moonkage.vendor.orderprofile.dto.request;

import java.util.List;
import java.util.Set;

/** FR-35, BR-14. */
public record SaveOrderProfileRequest(
        int minQty,
        Integer leadTimeDays,
        String earlyBirdOffer,
        Integer weeklyCapacity,
        String cakeTypes,
        String packagingTypes,
        Boolean logoPrinting,
        String distributedBrands,
        Integer gatherableQty,
        Set<String> customTypes,
        List<PriceTier> priceTiers) {

    public record PriceTier(int fromQty, long unitPrice) {}
}
