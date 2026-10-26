package com.moonkage.vendor.vendor;

/**
 * A read-only copy of what other components may know of a vendor (coding-rules 1.1: data crosses a component
 * boundary as a snapshot, never as the entity).
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
