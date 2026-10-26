package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.SaveDeliveryAreasRequest;
import java.util.List;

/** Provinces a vendor delivers to at its own flat fee (FR-28), part of the Vendor aggregate. */
public interface DeliveryAreaService {

    /** The owner or an admin; province codes in code order. */
    List<String> getDeliveryAreas(CurrentUserInfo caller, String vendorId);

    /** The owner of an approved vendor; replaces the whole list, orders already made keep theirs (FR-28). */
    List<String> saveDeliveryAreas(CurrentUserInfo caller, String vendorId, SaveDeliveryAreasRequest request);
}
