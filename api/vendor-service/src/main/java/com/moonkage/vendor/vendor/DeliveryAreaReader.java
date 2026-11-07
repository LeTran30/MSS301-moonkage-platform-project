package com.moonkage.vendor.vendor;

import java.util.List;

/**
 * The provinces a vendor delivers to, for its snapshot and detail. Implemented by the deliveryarea component, which
 * depends on this one: the vendor reads its delivery areas without knowing where they are stored.
 */
public interface DeliveryAreaReader {

    /** Province codes in code order; empty when the vendor has none. */
    List<String> provinceCodesOf(String vendorId);
}
