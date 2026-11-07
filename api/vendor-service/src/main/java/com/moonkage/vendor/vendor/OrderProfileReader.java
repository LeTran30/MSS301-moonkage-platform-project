package com.moonkage.vendor.vendor;

import java.util.Optional;

/**
 * A vendor's "accepting orders" terms as its snapshot carries them. Implemented by the orderprofile component, which
 * depends on this one.
 */
public interface OrderProfileReader {

    /** Empty when the vendor has no order profile. */
    Optional<VendorSnapshot.OrderProfileSnapshot> snapshotOf(String vendorId);
}
