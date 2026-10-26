package com.moonkage.vendor.vendor;

/**
 * A read-only copy of what other components and services may know of a vendor (coding-rules 1.1: data crosses a
 * component boundary as a snapshot, never as the entity). Also the body of GET /internal/vendors/by-owner: nothing
 * private (bank account, ID number, documents) is in it (NFR-03).
 *
 * @param canOperate approved and registration fee paid (BR-20, BR-31), as {@link Vendor#canOperate()}
 */
public record VendorView(
        String id,
        String ownerAccountId,
        String businessName,
        VendorStatus status,
        SupplySource supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        boolean canOperate) {

    public boolean isOwnedBy(String accountId) {
        return ownerAccountId.equals(accountId);
    }
}
