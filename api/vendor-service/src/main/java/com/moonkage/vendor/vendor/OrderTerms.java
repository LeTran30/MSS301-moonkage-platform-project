package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import java.util.Set;

/**
 * What a vendor accepts orders on (FR-35), checked against its supply source before it reaches the profile:
 * {@code weeklyCapacity}, {@code packagingTypes}, {@code logoPrinting} are set when the vendor produces itself
 * (AC-35.2); {@code distributedBrands}, {@code gatherableQty} when it resells (AC-35.3).
 */
record OrderTerms(
        Quantity minQty,
        int leadTimeDays,
        PriceTiers priceTiers,
        Set<CustomType> customTypes,
        String earlyBirdOffer,
        Quantity weeklyCapacity,
        String packagingTypes,
        Boolean logoPrinting,
        String distributedBrands,
        Quantity gatherableQty) {}
