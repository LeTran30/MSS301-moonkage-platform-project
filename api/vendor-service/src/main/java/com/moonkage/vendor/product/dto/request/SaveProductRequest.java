package com.moonkage.vendor.product.dto.request;

import com.moonkage.vendor.product.DeliveryLabel;
import com.moonkage.vendor.product.ProductConstant;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * A whole product, to create one (FR-29) or replace one (FR-30, FR-32, FR-33). Required fields are checked by the
 * product's own rules, which name the field that fails.
 *
 * @param version the version read before editing; required to replace, ignored to create
 * @param resold required when the vendor's supply source is BOTH; left out otherwise (AC-29.2)
 * @param brand left out: the vendor's business name, unless resold (AC-29.4)
 * @param origin required when resold (AC-33.2)
 * @param imageKeys in display order: temp keys of new uploads, or keys the product already has
 */
public record SaveProductRequest(
        Long version,
        Boolean resold,
        String name,
        String description,
        String brand,
        String origin,
        Integer piecesPerBox,
        Long listPrice,
        Integer stock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Integer quoteThreshold,
        List<PriceTier> priceTiers,

        @Size(max = ProductConstant.MAX_IMAGES, message = "{validation.too_many}")
        List<String> imageKeys,

        @Size(max = ProductConstant.MAX_CAKE_ATTRIBUTES, message = "{validation.too_many}")
        List<String> crustCodes,

        @Size(max = ProductConstant.MAX_CAKE_ATTRIBUTES, message = "{validation.too_many}")
        List<String> fillingCodes) {

    /** From fromQty pieces on, each costs unitPrice (AC-31.1). */
    public record PriceTier(Integer fromQty, Long unitPrice) {}
}
