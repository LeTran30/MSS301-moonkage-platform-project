package com.moonkage.vendor.dto.response;

import com.moonkage.vendor.entity.Vendor;

/** Vendor summary for its owner and for other services (via OpenFeign). */
public record VendorResponse(
        String id,
        String ownerAccountId,
        String legalName,
        String status,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders) {

    public static VendorResponse from(Vendor v) {
        return new VendorResponse(
                v.getId(),
                v.getOwnerAccountId(),
                v.getLegalName(),
                v.getStatus().name(),
                v.getSupplySource().name(),
                v.isSellsShop(),
                v.isAcceptsOrders());
    }
}
