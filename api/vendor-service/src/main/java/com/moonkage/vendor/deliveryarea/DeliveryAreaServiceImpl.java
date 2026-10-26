package com.moonkage.vendor.deliveryarea;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.deliveryarea.dto.SaveDeliveryAreasRequest;
import com.moonkage.vendor.security.CurrentUserInfo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Written in phase 3 of docs/services/vendor/completion-plan.md. */
@Service
@RequiredArgsConstructor
class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;

    @Override
    public List<String> getDeliveryAreas(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public List<String> saveDeliveryAreas(CurrentUserInfo caller, String vendorId, SaveDeliveryAreasRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }
}
