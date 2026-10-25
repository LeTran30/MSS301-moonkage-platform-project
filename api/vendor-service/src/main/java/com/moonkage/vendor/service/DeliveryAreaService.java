package com.moonkage.vendor.service;

import com.moonkage.vendor.dto.request.SaveDeliveryAreasRequest;
import java.util.List;

public interface DeliveryAreaService {

    List<String> getDeliveryAreas(String accountId, String vendorId);

    List<String> saveDeliveryAreas(String accountId, String vendorId, SaveDeliveryAreasRequest request);
}
