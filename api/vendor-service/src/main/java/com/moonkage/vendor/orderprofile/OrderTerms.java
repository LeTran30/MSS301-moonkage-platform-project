package com.moonkage.vendor.vendor;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.util.StringUtils;

/**
 * What a vendor accepts orders on (FR-35), complete for its supply source, so an order profile is never made from
 * terms that miss one: AC-35.1 for every vendor; when it produces itself (AC-35.2) the weekly capacity, the crusts
 * and fillings it makes, the packaging and the logo printing; when it resells (AC-35.3) the brands and the quantity
 * it can gather. Texts are trimmed, an empty optional text is null. A missing term is reported at its request field.
 */
record OrderTerms(
        SupplySource supplySource,
        Quantity minQty,
        int leadTimeDays,
        PriceTiers priceTiers,
        Set<CustomType> customTypes,
        String earlyBirdOffer,
        Quantity weeklyCapacity,
        List<CakeAttributeRef> crusts,
        List<CakeAttributeRef> fillings,
        String packagingTypes,
        Boolean logoPrinting,
        String distributedBrands,
        Quantity gatherableQty) {

    static final String MIN_QTY = "minQty";
    static final String LEAD_TIME_DAYS = "leadTimeDays";
    static final String PRICE_TIERS = "priceTiers";
    static final String WEEKLY_CAPACITY = "weeklyCapacity";
    static final String CRUST_CODES = "crustCodes";
    static final String FILLING_CODES = "fillingCodes";
    static final String PACKAGING_TYPES = "packagingTypes";
    static final String LOGO_PRINTING = "logoPrinting";
    static final String DISTRIBUTED_BRANDS = "distributedBrands";
    static final String GATHERABLE_QTY = "gatherableQty";

    OrderTerms {
        Objects.requireNonNull(supplySource, "supplySource");
        Objects.requireNonNull(minQty, "minQty");
        Objects.requireNonNull(priceTiers, "priceTiers");
        if (leadTimeDays < 0) {
            throw new AppException(ErrorCode.LEAD_TIME_INVALID).atField(LEAD_TIME_DAYS);
        }
        customTypes = customTypes == null ? Set.of() : Set.copyOf(customTypes);
        crusts = only(CakeAttributeGroup.CRUST, crusts);
        fillings = only(CakeAttributeGroup.FILLING, fillings);
        earlyBirdOffer = trimToNull(earlyBirdOffer);
        packagingTypes = trimToNull(packagingTypes);
        distributedBrands = trimToNull(distributedBrands);

        if (supplySource.produces()) {
            require(weeklyCapacity != null, WEEKLY_CAPACITY, supplySource);
            require(!crusts.isEmpty(), CRUST_CODES, supplySource);
            require(!fillings.isEmpty(), FILLING_CODES, supplySource);
            require(packagingTypes != null, PACKAGING_TYPES, supplySource);
            require(logoPrinting != null, LOGO_PRINTING, supplySource);
        }
        if (supplySource.resells()) {
            require(distributedBrands != null, DISTRIBUTED_BRANDS, supplySource);
            require(gatherableQty != null, GATHERABLE_QTY, supplySource);
        }
    }

    /** Crusts and fillings together, as the profile links them. */
    List<CakeAttributeRef> cakeAttributes() {
        return Stream.concat(crusts.stream(), fillings.stream()).toList();
    }

    private static List<CakeAttributeRef> only(CakeAttributeGroup group, List<CakeAttributeRef> values) {
        if (values == null) {
            return List.of();
        }
        if (values.stream().anyMatch(value -> value.group() != group)) {
            throw new IllegalArgumentException("Not all values are of group " + group);
        }
        return List.copyOf(values);
    }

    private static void require(boolean present, String field, SupplySource supplySource) {
        if (!present) {
            throw new AppException(ErrorCode.ORDER_TERM_REQUIRED, supplySource.name()).atField(field);
        }
    }

    private static String trimToNull(String text) {
        return StringUtils.hasText(text) ? text.trim() : null;
    }
}
