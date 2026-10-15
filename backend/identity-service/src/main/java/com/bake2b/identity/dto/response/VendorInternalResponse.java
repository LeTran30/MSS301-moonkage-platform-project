package com.bake2b.identity.dto.response;

import com.bake2b.identity.entity.Vendor;

/** What other services (via OpenFeign) need to know about a vendor. */
public record VendorInternalResponse(String id, String ownerUserId, String legalName, String status,
                                     String supplySource, boolean sellsShop, boolean acceptsOrders) {

    public static VendorInternalResponse from(Vendor v) {
        return new VendorInternalResponse(v.getId(), v.getOwner().getId(), v.getLegalName(), v.getStatus().name(),
                v.getSupplySource().name(), v.isSellsShop(), v.isAcceptsOrders());
    }
}
