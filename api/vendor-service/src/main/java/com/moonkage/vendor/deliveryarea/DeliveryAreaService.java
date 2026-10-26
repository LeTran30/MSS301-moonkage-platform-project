package com.moonkage.vendor.deliveryarea;

import com.moonkage.vendor.deliveryarea.dto.SaveDeliveryAreasRequest;
import com.moonkage.vendor.security.CurrentUserInfo;
import java.util.List;

/** Provinces a vendor delivers to (FR-28); only the vendor's owner reads or replaces them. */
public interface DeliveryAreaService {

    /** Province codes, as {@code Province} codes of common-reference. */
    List<String> getDeliveryAreas(CurrentUserInfo caller, String vendorId);

    List<String> saveDeliveryAreas(CurrentUserInfo caller, String vendorId, SaveDeliveryAreasRequest request);
}
