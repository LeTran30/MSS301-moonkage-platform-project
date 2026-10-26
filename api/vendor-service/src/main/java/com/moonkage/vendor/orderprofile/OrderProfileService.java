package com.moonkage.vendor.orderprofile;

import com.moonkage.vendor.orderprofile.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.orderprofile.dto.response.OrderProfileResponse;
import com.moonkage.vendor.security.CurrentUserInfo;

/** A vendor's "accepting orders" profile (FR-35); only the vendor's owner reads or replaces it. */
public interface OrderProfileService {

    OrderProfileResponse getOrderProfile(CurrentUserInfo caller, String vendorId);

    OrderProfileResponse saveOrderProfile(CurrentUserInfo caller, String vendorId, SaveOrderProfileRequest request);
}
