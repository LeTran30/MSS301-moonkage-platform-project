package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.SaveDeliveryAreasRequest;
import com.moonkage.vendor.vendor.vo.DeliveryAreas;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private static final String FIELD_PROVINCE_CODES = "provinceCodes";

    private final VendorFinder vendorFinder;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final VendorSnapshotPublisher snapshotPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<String> getDeliveryAreas(CurrentUserInfo caller, String vendorId) {
        vendorFinder.getVisibleTo(caller, vendorId);
        return codesOf(vendorId);
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
        Vendor vendor = vendorFinder.getForOwnerChange(caller, vendorId);
        vendor.checkSellingSettingsEditable();

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

        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return areas.codes();
    }

    private List<String> codesOf(String vendorId) {
        return deliveryAreaRepository.findByVendorId(vendorId).stream()
                .map(area -> area.getProvinceCode().value())
                .sorted()
                .toList();
    }
}
