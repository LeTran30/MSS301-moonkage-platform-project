package com.moonkage.vendor.vendor;

import java.util.List;
import java.util.Set;

/**
 * The whole state of a vendor that other services copy (vendor_snapshots of catalog, quotation, order): the
 * {@code data} of the envelope sent on vendor.updated and vendor.locked, whose {@code sourceVersion} is the vendor's
 * version. A full snapshot, not a change: a field that is null is null now.
 *
 * @param statusReason why the vendor is NEEDS_INFO, REJECTED or LOCKED (AC-27.2, AC-46.2)
 * @param canOperate approved and registration fee paid (BR-20, BR-31); computed here, not by the copies
 * @param localDeliveryFee null when the vendor never set one, which is not a free delivery
 * @param orderProfile null when the vendor has no order profile
 * @param changedBy account that made the change; null when the system did (a payment recorded)
 */
public record VendorSnapshot(
        String vendorId,
        String ownerAccountId,
        String businessName,
        VendorStatus status,
        String statusReason,
        boolean canOperate,
        boolean sellsShop,
        boolean acceptsOrders,
        List<String> deliveryAreas,
        Long localDeliveryFee,
        OrderProfileSnapshot orderProfile,
        String changedBy) {

    /**
     * What quotation-service matches requests against (FR-36). Crusts and fillings are codes of the FR-54 catalogue;
     * a rename there sends no event, the code stays.
     */
    public record OrderProfileSnapshot(
            int minQty,
            int leadTimeDays,
            List<PriceTierSnapshot> priceTiers,
            Set<CustomType> customTypes,
            String earlyBirdOffer,
            Integer weeklyCapacity,
            List<String> crustCodes,
            List<String> fillingCodes,
            String packagingTypes,
            Boolean logoPrinting,
            String distributedBrands,
            Integer gatherableQty) {}

    public record PriceTierSnapshot(int fromQty, long unitPrice) {}
}
