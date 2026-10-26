package com.moonkage.quotation.dto.response;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.util.List;

/**
 * A vendor that takes custom orders (FR-14).
 *
 * @param ordersOnly no Shop: shown with the label "Chỉ nhận đặt hàng" (AC-14.3)
 * @param refPriceTiers reference only; the price in the quote binds (AC-14.2, BR-05)
 * @param isOwn the viewer owns this vendor: no direct request button (AC-14.4, BR-22)
 */
public record SupplierResponse(
        String vendorId,
        String businessName,
        boolean ordersOnly,
        String supplySource,
        Integer minQty,
        Integer leadTimeDays,
        List<String> customCapabilities,
        List<String> deliveryAreas,
        String earlyBirdOffer,
        @JsonRawValue String refPriceTiers,
        boolean isOwn) {}
