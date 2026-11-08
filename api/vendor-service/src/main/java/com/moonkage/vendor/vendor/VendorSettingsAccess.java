package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;

/**
 * What the components of a vendor's selling settings (deliveryarea, orderprofile) need from the vendor. Their rows
 * belong to the Vendor aggregate even though they live in their own packages: every change locks the vendor row,
 * raises its version and ends with one vendor.updated snapshot, so two changes of one vendor never announce out of
 * order.
 */
public interface VendorSettingsAccess {

    /** Its owner or an admin may read the settings; throws VENDOR_NOT_FOUND or ACCESS_DENIED. */
    void checkVisibleTo(CurrentUserInfo caller, String vendorId);

    /**
     * Its owner only, about to change a selling setting (FR-28, FR-35): the row locked and its version raised, the
     * vendor in a state that allows the change.
     */
    EditableVendor lockForOwnerChange(CurrentUserInfo caller, String vendorId);

    /** vendor.updated after a setting changed, in the same transaction as the change. */
    void announceChanged(String vendorId, String changedBy);
}
