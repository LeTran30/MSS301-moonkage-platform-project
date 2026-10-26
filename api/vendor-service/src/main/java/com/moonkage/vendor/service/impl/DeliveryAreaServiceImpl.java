package com.moonkage.vendor.service.impl;

import com.moonkage.vendor.dto.request.SaveDeliveryAreasRequest;
import com.moonkage.vendor.repository.DeliveryAreaRepository;
import com.moonkage.vendor.service.DeliveryAreaService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;

    @Override
    public List<String> getDeliveryAreas(String accountId, String vendorId) {
        return List.of();
    }

    @Override
    public List<String> saveDeliveryAreas(String accountId, String vendorId, SaveDeliveryAreasRequest request) {
        return List.of();
    }
}
