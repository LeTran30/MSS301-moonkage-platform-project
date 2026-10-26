package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.SupplySource;
import com.moonkage.vendor.vendor.VendorEntityType;
import com.moonkage.vendor.vendor.VendorStatus;
import java.time.Instant;
import java.util.List;

/**
 * A vendor profile as its owner and the admin see it (FR-27, AC-45.1). Personal numbers are masked only.
 *
 * @param documents the current document of each kind
 * @param ownerCheck the owner check of the latest submission (AC-45.4); null unless the caller is an admin
 */
public record VendorDetailResponse(
        String id,
        String ownerAccountId,
        String businessName,
        VendorEntityType entityType,
        String taxCode,
        String address,
        String provinceCode,
        String representativeName,
        String representativeIdMasked,
        SupplySource supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        BankAccount bankAccount,
        VendorStatus status,
        String statusReason,
        boolean canOperate,
        Long localDeliveryFee,
        Instant registrationFeePaidAt,
        List<VendorDocumentResponse> documents,
        OwnerCheckResponse ownerCheck,
        Instant createdAt,
        Instant updatedAt) {

    public record BankAccount(String bankName, String maskedNumber, String holder) {}
}
