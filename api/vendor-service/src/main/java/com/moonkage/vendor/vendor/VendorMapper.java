package com.moonkage.vendor.vendor;

import com.moonkage.vendor.vendor.dto.response.VendorResponse;

/** Entity → DTO for vendors. DTOs must not depend on entities (ArchitectureTest). */
final class VendorMapper {

    private VendorMapper() {}

    static VendorResponse toResponse(Vendor v) {
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
