package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class VendorSettingsAccessImpl implements VendorSettingsAccess {

    private final VendorFinder vendorFinder;
    private final VendorSnapshotPublisher snapshotPublisher;

    @Override
    public void checkVisibleTo(CurrentUserInfo caller, String vendorId) {
        vendorFinder.getVisibleTo(caller, vendorId);
    }

    @Override
    public EditableVendor lockForOwnerChange(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.getForOwnerChange(caller, vendorId);
        vendor.checkSellingSettingsEditable();
        return new EditableVendor(vendor.getId(), vendor.isAcceptsOrders(), vendor.getSupplySource());
    }

    @Override
    public void announceChanged(String vendorId, String changedBy) {
        // the vendor locked by lockForOwnerChange, already managed in this transaction
        snapshotPublisher.announceUpdated(vendorFinder.get(vendorId), changedBy);
    }
}
