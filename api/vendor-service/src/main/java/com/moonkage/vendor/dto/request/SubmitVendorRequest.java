package com.moonkage.vendor.dto.request;

import java.util.List;

/** Vendor application, used for the first submission (FR-26) and for resubmitting (AC-27.2). */
public record SubmitVendorRequest(
        String businessName,
        String entityType,
        String taxCode,
        String address,
        String provinceCode,
        String representativeName,
        String representativeIdNumber,
        String supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        String bankName,
        String bankAccountNumber,
        String bankAccountHolder,
        List<Document> documents) {

    /** @param objectKey returned by POST /api/vendors/uploads */
    public record Document(String kind, String objectKey) {}
}
