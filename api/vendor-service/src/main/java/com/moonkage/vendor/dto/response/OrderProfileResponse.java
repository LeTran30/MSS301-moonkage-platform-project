package com.moonkage.vendor.dto.response;

import java.util.List;
import java.util.Set;

public record OrderProfileResponse(
        String id,
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
