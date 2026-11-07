package com.moonkage.vendor.deliveryarea;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.deliveryarea.dto.SaveDeliveryAreasRequest;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.DeliveryAreaReader;
import com.moonkage.vendor.vendor.VendorSettingsAccess;
import com.moonkage.vendor.vendor.elements.DeliveryAreas;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private static final String FIELD_PROVINCE_CODES = "provinceCodes";

    private final VendorSettingsAccess vendorAccess;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final DeliveryAreaReader deliveryAreaReader;

    @Override
    @Transactional(readOnly = true)
    public List<String> getDeliveryAreas(CurrentUserInfo caller, String vendorId) {
        vendorAccess.checkVisibleTo(caller, vendorId);
        return deliveryAreaReader.provinceCodesOf(vendorId);
    }

    @Override
    @Transactional
    public List<String> saveDeliveryAreas(CurrentUserInfo caller, String vendorId, SaveDeliveryAreasRequest request) {
        DeliveryAreas areas;
        try {
            areas = DeliveryAreas.of(request.provinceCodes());
        } catch (AppException e) {
            throw e.atField(FIELD_PROVINCE_CODES);
        }
        vendorAccess.lockForOwnerChange(caller, vendorId);

        // only the difference is written: a province kept keeps its row (unique per vendor and province)
        List<DeliveryArea> current = deliveryAreaRepository.findByVendorId(vendorId);
        current.stream()
                .filter(area -> !areas.contains(area.getProvinceCode()))
                .forEach(deliveryAreaRepository::delete);
        List<ProvinceCode> kept =
                current.stream().map(DeliveryArea::getProvinceCode).toList();
        areas.provinces().stream()
                .filter(province -> !kept.contains(province))
                .forEach(province -> deliveryAreaRepository.save(DeliveryArea.of(vendorId, province)));

        vendorAccess.announceChanged(vendorId, caller.accountId());
        return areas.codes();
    }
}
