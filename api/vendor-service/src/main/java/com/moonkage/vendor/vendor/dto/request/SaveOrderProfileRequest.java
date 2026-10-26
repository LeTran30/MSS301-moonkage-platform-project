package com.moonkage.vendor.vendor.dto.request;

import com.moonkage.vendor.vendor.CustomType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import java.util.Set;

/**
 * Replaces the vendor's order profile (FR-35). Quantities and prices are checked by their value objects; an error
 * names the field.
 *
 * @param priceTiers reference tiers (AC-35.1), at least one, each starting at a different quantity
 * @param customTypes the custom work offered, within BR-14
 * @param weeklyCapacity required when the vendor produces itself, with packagingTypes and logoPrinting (AC-35.2)
 * @param distributedBrands required when the vendor resells, with gatherableQty (AC-35.3)
 */
public record SaveOrderProfileRequest(
        Integer minQty,

        @NotNull(message = "{validation.required}") @PositiveOrZero(message = "{validation.positive_or_zero}")
        Integer leadTimeDays,

        @NotEmpty(message = "{validation.required}") List<@Valid @NotNull PriceTier> priceTiers,
        Set<CustomType> customTypes,
        String earlyBirdOffer,
        Integer weeklyCapacity,
        String packagingTypes,
        Boolean logoPrinting,
        String distributedBrands,
        Integer gatherableQty) {

    public record PriceTier(Integer fromQty, Long unitPrice) {}
}
