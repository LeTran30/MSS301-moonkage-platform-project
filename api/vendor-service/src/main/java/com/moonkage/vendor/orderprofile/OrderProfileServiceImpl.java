package com.moonkage.vendor.orderprofile;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.orderprofile.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.orderprofile.dto.response.OrderProfileResponse;
import com.moonkage.vendor.security.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Written in phase 3 of docs/services/vendor/completion-plan.md. */
@Service
@RequiredArgsConstructor
class OrderProfileServiceImpl implements OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;

    @Override
    public OrderProfileResponse getOrderProfile(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public OrderProfileResponse saveOrderProfile(
            CurrentUserInfo caller, String vendorId, SaveOrderProfileRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }
}
