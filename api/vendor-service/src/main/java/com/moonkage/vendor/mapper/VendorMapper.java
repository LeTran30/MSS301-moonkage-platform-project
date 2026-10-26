package com.moonkage.vendor.mapper;

import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.entity.Vendor;

/** Entity → DTO for vendors. DTOs must not depend on entities (ArchitectureTest). */
public final class VendorMapper {

    private VendorMapper() {}

    public static VendorResponse toResponse(Vendor v) {
        return new VendorResponse(
                v.getId(),
                v.getOwnerAccountId(),
                v.getBusinessName(),
                v.getStatus().name(),
                v.getSupplySource().name(),
                v.isSellsShop(),
                v.isAcceptsOrders());
    }
}
