package com.moonkage.vendor.service;

import com.moonkage.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.dto.response.OrderProfileResponse;

public interface OrderProfileService {

    OrderProfileResponse getOrderProfile(String accountId, String vendorId);

    OrderProfileResponse saveOrderProfile(String accountId, String vendorId, SaveOrderProfileRequest request);
}
