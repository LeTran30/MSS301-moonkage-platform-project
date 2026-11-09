package com.moonkage.vendor.orderprofile;

import com.moonkage.vendor.orderprofile.dto.OrderProfileResponse;
import com.moonkage.vendor.orderprofile.dto.SaveOrderProfileRequest;
import com.moonkage.vendor.security.CurrentUserInfo;

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
