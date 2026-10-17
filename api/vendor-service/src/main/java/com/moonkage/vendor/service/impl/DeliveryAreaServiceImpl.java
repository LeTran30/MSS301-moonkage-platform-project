package com.moonkage.vendor.service.impl;

import com.moonkage.vendor.repository.DeliveryAreaRepository;
import com.moonkage.vendor.service.DeliveryAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;
}
