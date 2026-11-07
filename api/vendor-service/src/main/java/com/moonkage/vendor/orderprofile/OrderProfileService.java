package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.vendor.dto.response.OrderProfileResponse;

/** A vendor's "accepting orders" profile (FR-35), part of the Vendor aggregate. */
public interface OrderProfileService {

    /** The owner or an admin. */
    OrderProfileResponse getOrderProfile(CurrentUserInfo caller, String vendorId);

    /**
     * The owner of an approved vendor that accepts orders; creates or replaces the profile. Requests already sent
     * keep the terms they were made on.
     */
    OrderProfileResponse saveOrderProfile(CurrentUserInfo caller, String vendorId, SaveOrderProfileRequest request);
}
