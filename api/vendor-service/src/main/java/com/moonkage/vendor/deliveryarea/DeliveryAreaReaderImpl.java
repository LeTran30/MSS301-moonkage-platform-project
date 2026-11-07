package com.moonkage.vendor.deliveryarea;

import com.moonkage.vendor.vendor.DeliveryAreaReader;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** The delivery areas as the vendor's snapshot and detail show them. */
@Component
@RequiredArgsConstructor
class DeliveryAreaReaderImpl implements DeliveryAreaReader {

    private final DeliveryAreaRepository deliveryAreaRepository;

    @Override
    public List<String> provinceCodesOf(String vendorId) {
        return deliveryAreaRepository.findByVendorId(vendorId).stream()
                .map(area -> area.getProvinceCode().value())
                .sorted()
                .toList();
    }
}
