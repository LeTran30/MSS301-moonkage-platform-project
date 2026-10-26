package com.moonkage.quotation.mapper;

import com.moonkage.quotation.dto.response.SupplierResponse;
import com.moonkage.quotation.entity.VendorSnapshot;
import java.util.List;

public final class SupplierMapper {

    private SupplierMapper() {}

    public static SupplierResponse toResponse(VendorSnapshot vendor, boolean isOwn) {
        return new SupplierResponse(
                vendor.getVendorId(),
                vendor.getBusinessName(),
                !vendor.isSellsShop(),
                vendor.getSupplySource(),
                vendor.getMinQty(),
                vendor.getLeadTimeDays(),
                List.copyOf(vendor.getCustomCapabilities()),
                List.copyOf(vendor.getDeliveryAreas()),
                vendor.getEarlyBirdOffer(),
                vendor.getRefPriceTiers(),
                isOwn);
    }
}
