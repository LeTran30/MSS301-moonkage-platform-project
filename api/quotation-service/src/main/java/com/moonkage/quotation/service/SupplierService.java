package com.moonkage.quotation.service;

import com.moonkage.quotation.dto.response.SupplierResponse;
import com.moonkage.quotation.enums.CustomType;
import java.util.List;

/** Vendors that take custom orders, read from the vendor copy (FR-14). */
public interface SupplierService {

    /**
     * @param accountId the viewer, null for a guest
     * @param quantity only vendors whose minimum order is at most this
     * @param name part of the vendor's name (AC-14.6)
     */
    List<SupplierResponse> searchSuppliers(
            String accountId, String provinceCode, CustomType customType, Integer quantity, String name);

    SupplierResponse getSupplier(String accountId, String vendorId);
}
